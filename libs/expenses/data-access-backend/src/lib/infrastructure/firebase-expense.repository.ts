import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ExpenseRepository } from '../expense.repository';
import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, AnalyticsFilters, PersonalExpenseRequestFilters, ExpenseAuditLogDocument, ReviewerExpenseRequestFilters } from '@school-expense-ecosystem/expenses/types';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class FirebaseExpenseRepository implements ExpenseRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
  ) { }

  private get collection() {
    return this.db.collection('expenses')
  }

  private get auditLogsCollection() {
    return this.db.collection('expense_audit_logs');
  }

  private toIsoString(val: unknown): string {
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (val) {
      return new Date(val as string | number | Date).toISOString();
    }
    return new Date().toISOString();
  }

  private toDate(val: unknown): Date {
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate();
    }
    return new Date((val as string | number | Date) || Date.now());
  }

  private formatYearMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private mapDocToExpense(doc: admin.firestore.DocumentSnapshot): ExpenseList {
    const data = doc.data();
    if (!data) throw new Error(`Document data is empty for ID: ${doc.id}`);

    return {
      ...data,
      id: doc.id,
      date: this.toIsoString(data['date']),
      createdAt: this.toIsoString(data['createdAt']),
      updatedAt: this.toIsoString(data['updatedAt']),
      paidMethod: data['paidMethod'] || 'CASH',
    } as unknown as ExpenseList;
  }

  private applyDateAndSearchFilters<T extends admin.firestore.Query>(
    baseQuery: T,
    // Architect Fix: Support nullable filter values (number | null | undefined) to match DTO definitions
    filters: { year?: number | null; month?: number | null; searchTerm?: string | null }
  ): T {
    let query = baseQuery;

    if (filters.year && filters.month) {
      const targetQueryStr = this.formatYearMonth(filters.year, filters.month);
      query = query.where('filterYearMonth', '==', targetQueryStr) as T;
    } else if (filters.year) {
      const startOfYear = new Date(`${filters.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${filters.year}-12-31T23:59:59.999Z`);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfYear)) as T;
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.trim();
      query = query
        .where('description', '>=', term)
        .where('description', '<=', term + '\uf8ff') as T;
    }

    return query;
  }

  private applySorting<T extends admin.firestore.Query>(
    baseQuery: T,
    // Architect Fix: Support nullable filter values (number | null | undefined) to match DTO definitions
    filters: { year?: number | null; month?: number | null; searchTerm?: string | null }
  ): T {
    let query = baseQuery;

    if (filters.searchTerm) {
      query = query.orderBy('description') as T;
    } else if (!filters.month && filters.year) {
      query = query.orderBy('date', 'desc') as T;
    } else {
      query = query.orderBy('updatedAt', 'desc') as T;
    }

    return query;
  }

  private applyReviewerScope<T extends admin.firestore.Query>(
    baseQuery: T,
    user: AuthenticatedUser
  ): T {
    let query = baseQuery;
    if (
      (user.role === Role.LEVEL_3_USER && user.userType === UserType.TEACHER) ||
      user.role === Role.LEVEL_2_DEAN
    ) {
      query = query.where('facultyId', '==', user.facultyId) as T;
    }
    return query;
  }

  private async executePaginatedQuery(
    baseFilteredQuery: admin.firestore.Query,
    limit: number,
    pageToken?: string
  ): Promise<PaginatedExpensesResponse> {
    let query = baseFilteredQuery;

    if (pageToken) {
      const startDoc = await this.collection.doc(pageToken).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const [snapshot, countSnapshot] = await Promise.all([
      query.limit(limit).get(),
      baseFilteredQuery.count().get()
    ]);

    const expenses = snapshot.docs.map(doc => this.mapDocToExpense(doc));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;
    const totalItems = countSnapshot.data().count;

    return { expenses, nextPageToken, totalItems };
  }

  async findPersonalExpensePaginated(filters: PersonalExpenseRequestFilters): Promise<PaginatedExpensesResponse> {
    let baseQuery = this.collection.where('userId', '==', filters.userId);
    baseQuery = this.applyDateAndSearchFilters(baseQuery, filters);

    const sortedQuery = this.applySorting(baseQuery, filters);
    return this.executePaginatedQuery(sortedQuery, filters.limit, filters.pageToken);
  }

  async findReviewerExpensesPaginated(
    user: AuthenticatedUser,
    filters: ReviewerExpenseRequestFilters
  ): Promise<PaginatedExpensesResponse> {
    // Architect Fix: Assigning CollectionReference directly to Query variable (Upcasting is always valid)
    let baseQuery: admin.firestore.Query = this.collection;
    baseQuery = this.applyReviewerScope(baseQuery, user);

    if (filters.status && filters.status !== 'ALL') {
      baseQuery = baseQuery.where('status', '==', filters.status);
    }

    baseQuery = this.applyDateAndSearchFilters(baseQuery, filters);

    const sortedQuery = this.applySorting(baseQuery, filters);
    return this.executePaginatedQuery(sortedQuery, filters.limit, filters.pageToken);
  }

  async findById(id: string): Promise<ExpenseList | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToExpense(doc);
  }

  async create(data: Omit<ExpenseList, 'id'>): Promise<ExpenseList> {
    const docRef = this.collection.doc();
    const expenseDate = new Date(data.date);

    const firestorePayload = {
      ...data,
      date: admin.firestore.Timestamp.fromDate(expenseDate),
      filterYearMonth: this.formatYearMonth(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth() + 1),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    await docRef.set(firestorePayload);
    const freshDoc = await docRef.get();
    return this.mapDocToExpense(freshDoc);
  }

  async update(id: string, data: Partial<ExpenseList>): Promise<ExpenseList> {
    const docRef = this.collection.doc(id);

    const updatePayload: Record<string, unknown> = {
      ...data,
      updatedAt: admin.firestore.Timestamp.now()
    };

    if (data.date) {
      updatePayload['date'] = admin.firestore.Timestamp.fromDate(new Date(data.date));
    }

    if (data.status && data.status !== 'REJECTED') {
      updatePayload['rejectReason'] = admin.firestore.FieldValue.delete();
    }

    await docRef.update(updatePayload);
    const updatedDoc = await docRef.get();
    return this.mapDocToExpense(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findAvailableYears(userId: string): Promise<number[]> {
    // Architect Optimization: Use .select('date') to minimize Firestore network bandwidth
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .select('date')
      .get();

    const yearsSet = new Set<number>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data['date']) {
        yearsSet.add(this.toDate(data['date']).getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }

  async getAnalytics(filters: AnalyticsFilters): Promise<ExpenseAnalyticsDto> {
    let query: admin.firestore.Query = this.collection;

    if (filters.role === Role.LEVEL_2_DEAN && filters.facultyId) {
      query = query.where('facultyId', '==', filters.facultyId);
    }

    if (filters.year && filters.month) {
      const startOfMonth = new Date(`${filters.year}-${String(filters.month).padStart(2, '0')}-01T00:00:00.000Z`);
      const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfMonth));
    } else if (filters.year) {
      const startOfYear = new Date(`${filters.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${filters.year}-12-31T23:59:59.999Z`);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfYear));
    }

    const snapshot = await query.get();
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        amount: Number(data['amount']) || 0,
        paidMethod: data['paidMethod'] || data['paid'] || 'CASH',
        date: this.toDate(data['date'])
      };
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const max = count > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    // 1. Pie Chart
    const pieMap: Record<string, number> = {};
    // 2. Line Chart
    const lineMap: Record<string, number> = {};
    // 3. Bar Chart
    const barMap: Record<string, number> = {};

    expenses.forEach(e => {
      pieMap[e.paidMethod] = (pieMap[e.paidMethod] || 0) + e.amount;

      const dayStr = e.date.toISOString().split('T')[0];
      lineMap[dayStr] = (lineMap[dayStr] || 0) + e.amount;

      const monthStr = e.date.toLocaleString('en-US', { month: 'short' });
      barMap[monthStr] = (barMap[monthStr] || 0) + e.amount;
    });

    const pieData = Object.entries(pieMap).map(([label, amount]) => ({ label, amount }));
    const lineData = Object.entries(lineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, amount]) => ({ label, amount }));
    const barData = Object.entries(barMap).map(([label, amount]) => ({ label, amount }));

    return {
      kpis: { total, count, max, changePct: null },
      pieData,
      lineData,
      barData
    };
  }

  async createAuditLog(log: Omit<ExpenseAuditLogDocument, 'id'>): Promise<void> {
    const docRef = this.auditLogsCollection.doc();
    await docRef.set({
      ...log,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(log.createdAt))
    });
  }
}