import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ExpenseRepository } from '../expense.repository';
import { ExpenseList, CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';

@Injectable()
export class FirebaseExpenseRepository implements ExpenseRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
  ) {}

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

  async findByUserId(userId: string, year?: number): Promise<ExpenseList[]> {
    let query: admin.firestore.Query = this.db.collection('expenses').where('userId', '==', userId);

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfYear));
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => this.mapDocToExpense(doc));
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
}