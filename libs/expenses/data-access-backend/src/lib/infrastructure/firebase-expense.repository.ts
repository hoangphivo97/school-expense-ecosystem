import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ExpenseRepository } from '../expense.repository';
import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, AnalyticsFilters, ExpenseFilters, ExpenseAuditLogDocument } from '@school-expense-ecosystem/expenses/types';
import { Role } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class FirebaseExpenseRepository implements ExpenseRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
  ) { }

  private mapDocToExpense(doc: admin.firestore.DocumentSnapshot): ExpenseList {
    const data = doc.data();
    if (!data) throw new Error(`Document data is empty for ID: ${doc.id}`);

    const dateStr = data['date'] instanceof admin.firestore.Timestamp
      ? data['date'].toDate().toISOString()
      : new Date(data['date'] || Date.now()).toISOString();

    const createdAtStr = data['createdAt'] instanceof admin.firestore.Timestamp
      ? data['createdAt'].toDate().toISOString()
      : new Date(data['createdAt'] || Date.now()).toISOString();

    const updatedAtStr = data['updatedAt'] instanceof admin.firestore.Timestamp
      ? data['updatedAt'].toDate().toISOString()
      : new Date(data['updatedAt'] || Date.now()).toISOString();

    return {
      ...data,
      id: doc.id,
      date: dateStr,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
      paidMethod: data['paidMethod'] || 'CASH',
    } as unknown as ExpenseList;
  }

  async findPaginated(filters: ExpenseFilters): Promise<PaginatedExpensesResponse> {
    let query: admin.firestore.Query = this.db.collection('expenses').where('userId', '==', filters.userId);

    if (filters.year && filters.month) {
      // Scenario A: Exact Month Selected -> Utilize high-performance equality token to unlock flexible sorting
      const targetQueryStr = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
      query = query.where('filterYearMonth', '==', targetQueryStr);
    } else if (filters.year) {
      // Scenario B: All Months Selected -> Fall back to date-range inequality constraints covering the full calendar year
      const startOfYear = new Date(`${filters.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${filters.year}-12-31T23:59:59.999Z`);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfYear));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.trim();
      query = query
        .where('description', '>=', term)
        .where('description', '<=', term + '\uf8ff')
        .orderBy('description');
    } else {
      if (!filters.month && filters.year) {
        query = query.orderBy('date', 'desc');
      } else {
        query = query.orderBy('updatedAt', 'desc');
      }
    }

    if (filters.pageToken) {
      const startDoc = await this.db.collection('expenses').doc(filters.pageToken).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.limit(filters.limit).get();
    const expenses = snapshot.docs.map(doc => this.mapDocToExpense(doc));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;

    let countQuery = this.db.collection('expenses').where('userId', '==', filters.userId);
    if (filters.year && filters.month) {
      const targetQueryStr = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
      countQuery = countQuery.where('filterYearMonth', '==', targetQueryStr);
    } else if (filters.year) {
      const startOfYear = new Date(`${filters.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${filters.year}-12-31T23:59:59.999Z`);
      countQuery = countQuery
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfYear));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.trim();
      countQuery = countQuery
        .where('description', '>=', term)
        .where('description', '<=', term + '\uf8ff');
    }

    const countSnapshot = await countQuery.count().get();
    const totalItems = countSnapshot.data().count;

    return { expenses, nextPageToken, totalItems };
  }

  async findById(id: string): Promise<ExpenseList | null> {
    const doc = await this.db.collection('expenses').doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToExpense(doc);
  }

  async create(data: Omit<ExpenseList, 'id'>): Promise<ExpenseList> {
    const docRef = this.db.collection('expenses').doc();

    // Dynamically compute the equality tracking token string based on the provided target expense date
    const expenseDate = new Date(data.date);
    const mm = String(expenseDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = expenseDate.getUTCFullYear();

    const firestorePayload = {
      ...data,
      date: admin.firestore.Timestamp.fromDate(expenseDate),
      filterYearMonth: `${yyyy}-${mm}`,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    await docRef.set(firestorePayload);
    const freshDoc = await docRef.get();
    return this.mapDocToExpense(freshDoc);
  }

  async update(id: string, data: Partial<ExpenseList>): Promise<ExpenseList> {
    const docRef = this.db.collection('expenses').doc(id);

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
    await this.db.collection('expenses').doc(id).delete();
  }

  async findAvailableYears(userId: string): Promise<number[]> {
    const snapshot = await this.db.collection('expenses').where('userId', '==', userId).get();
    const yearsSet = new Set<number>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data['date'] instanceof admin.firestore.Timestamp) {
        yearsSet.add(data['date'].toDate().getFullYear());
      } else if (data['date']) {
        yearsSet.add(new Date(data['date']).getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }

  async getAnalytics(filters: AnalyticsFilters): Promise<ExpenseAnalyticsDto> {
    let query: admin.firestore.Query = this.db.collection('expenses');

    // 🎯 ĐÃ VÁ BUG: Khớp chuẩn Enum Role.LEVEL_2_DEAN thay thế cho text thô 'UserLevel2' cũ
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
        date: data['date'] instanceof admin.firestore.Timestamp ? data['date'].toDate() : new Date(data['date'])
      };
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const max = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    // 1. Biểu đồ tròn
    const pieMap: Record<string, number> = {};
    expenses.forEach(e => {
      pieMap[e.paidMethod] = (pieMap[e.paidMethod] || 0) + e.amount;
    });
    const pieData = Object.entries(pieMap).map(([label, amount]) => ({ label, amount }));

    // 2. Biểu đồ đường
    const lineMap: Record<string, number> = {};
    expenses.forEach(e => {
      const dayStr = e.date.toISOString().split('T')[0];
      lineMap[dayStr] = (lineMap[dayStr] || 0) + e.amount;
    });
    const lineData = Object.entries(lineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, amount]) => ({ label, amount }));

    // 3. Biểu đồ cột
    const barMap: Record<string, number> = {};
    expenses.forEach(e => {
      const monthStr = e.date.toLocaleString('en-US', { month: 'short' });
      barMap[monthStr] = (barMap[monthStr] || 0) + e.amount;
    });
    const barData = Object.entries(barMap).map(([label, amount]) => ({ label, amount }));

    return {
      kpis: { total, count, max, changePct: null },
      pieData,
      lineData,
      barData
    };
  }

  async createAuditLog(log: Omit<ExpenseAuditLogDocument, 'id'>): Promise<void> {
    const docRef = this.db.collection('expense_audit_logs').doc();
    await docRef.set({
      ...log,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(log.createdAt))
    });
  }
}