import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ExpenseRepository } from '../expense.repository';
import { ExpenseList, CreateExpenseDto, UpdateExpenseDto, PaginatedExpensesResponse, ExpenseAnalyticsDto } from '@school-expense-ecosystem/expenses/types';

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
      : new Date(data['date']).toISOString();

    const createdAtStr = data['createdAt'] instanceof admin.firestore.Timestamp
      ? data['createdAt'].toDate().toISOString()
      : new Date(data['createdAt']).toISOString();

    return {
      ...data,
      id: doc.id,
      date: dateStr,
      createdAt: createdAtStr,
    } as unknown as ExpenseList;
  }

  async findPaginated(filters: { userId: string; year: number; month: number; limit: number; pageToken?: string, searchTerm?: string; }): Promise<PaginatedExpensesResponse> {
    let query: admin.firestore.Query = this.db.collection('expenses').where('userId', '==', filters.userId);

    // Apply strict month/year chronological boundaries if parameters exist
    if (filters.year && filters.month) {
      const startOfMonth = new Date(`${filters.year}-${String(filters.month).padStart(2, '0')}-01T00:00:00.000Z`);
      const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfMonth));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.trim();
      query = query
        .where('description', '>=', term)
        .where('description', '<=', term + '\uf8ff')
        .orderBy('description'); 
    } else {
      query = query.orderBy('createdAt', 'desc'); // Mặc định xếp theo ngày tạo mới nhất
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

    // Aggregates total database count for the active scoped filter parameters
    let countQuery = this.db.collection('expenses').where('userId', '==', filters.userId);
    if (filters.year && filters.month) {
      const startOfMonth = new Date(`${filters.year}-${String(filters.month).padStart(2, '0')}-01T00:00:00.000Z`);
      const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      countQuery = countQuery
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfMonth));
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

  async create(userId: string, data: CreateExpenseDto): Promise<ExpenseList> {
    const docRef = this.db.collection('expenses').doc();

    const firestorePayload = {
      ...data,
      userId,
      date: admin.firestore.Timestamp.fromDate(new Date(data.date)),
      createdAt: admin.firestore.Timestamp.now()
    };

    await docRef.set(firestorePayload);
    const freshDoc = await docRef.get();
    return this.mapDocToExpense(freshDoc);
  }

  async update(id: string, data: UpdateExpenseDto): Promise<ExpenseList> {
    const docRef = this.db.collection('expenses').doc(id);
    const updatePayload: Record<string, unknown> = { ...data as Record<string, unknown> };

    if (data.date) {
      updatePayload['date'] = admin.firestore.Timestamp.fromDate(new Date(data.date));
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

    return Array.from(yearsSet).sort((a, b) => b - a); // Trả về danh sách năm giảm dần
  }

  async getAnalytics(filters: { 
    year?: number; 
    month?: number; 
    role: string; 
    facultyId?: string 
  }): Promise<ExpenseAnalyticsDto> {
    let query: admin.firestore.Query = this.db.collection('expenses');

    // 🌟 ROLE-BASED DATA SCOPING: Level 1 xem toàn trường (không lọc), Level 2 chỉ lọc đúng khoa của mình
    if (filters.role === 'UserLevel2' && filters.facultyId) {
      query = query.where('facultyId', '==', filters.facultyId);
    }

    // Áp dụng bộ lọc thời gian Năm/Tháng cụ thể
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
        paid: data['paid'] || 'CASH',
        date: data['date'] instanceof admin.firestore.Timestamp ? data['date'].toDate() : new Date(data['date'])
      };
    });

    // SERVER-SIDE AGGREGATION PIPELINE
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const max = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    // 1. Gom nhóm biểu đồ tròn (Cơ cấu hình thức thanh toán)
    const pieMap: Record<string, number> = {};
    expenses.forEach(e => {
      pieMap[e.paid] = (pieMap[e.paid] || 0) + e.amount;
    });
    const pieData = Object.entries(pieMap).map(([label, amount]) => ({ label, amount }));

    // 2. Gom nhóm biểu đồ đường (Xu hướng chi tiêu theo từng ngày)
    const lineMap: Record<string, number> = {};
    expenses.forEach(e => {
      const dayStr = e.date.toISOString().split('T')[0];
      lineMap[dayStr] = (lineMap[dayStr] || 0) + e.amount;
    });
    const lineData = Object.entries(lineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, amount]) => ({ label, amount }));

    // 3. Gom nhóm biểu đồ cột (Phân phối chi tiêu theo tháng)
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
}