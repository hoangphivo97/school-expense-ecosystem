import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {  DepartmentFundBalanceResult, FacultyId } from '@school-expense-ecosystem/shared/types';
import { DepartmentFundRepository } from '../abstracts/department-fund.repository';
import { CreateDepartmentFundPayload } from '@school-expense-ecosystem/finance/types';

@Injectable()
export class FirestoreDepartmentFundRepository implements DepartmentFundRepository {
  private readonly collection = admin.firestore().collection('department_funds');

  async getDepartmentFund(facultyId: FacultyId, year: number): Promise<DepartmentFundBalanceResult | null> {
    const fundId = `${facultyId.toUpperCase()}_DEPT_${year}`;
    return this.findById(fundId);
  }

  async findById(fundId: string): Promise<DepartmentFundBalanceResult | null> {
    const docSnap = await this.collection.doc(fundId).get();
    if (!docSnap.exists) {
      return null;
    }

    return this.mapDoc(docSnap);
  }

  async findAllByYear(year: number): Promise<DepartmentFundBalanceResult[]> {
    const snapshot = await this.collection.where('year', '==', year).get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => this.mapDoc(doc));
  }

  async createFund(payload: CreateDepartmentFundPayload): Promise<DepartmentFundBalanceResult> {
    const docRef = this.collection.doc(payload.fundId);
    const existing = await docRef.get();

    if (existing.exists) {
      throw new ConflictException(`Department fund "${payload.fundId}" already exists.`);
    }

    await docRef.set(payload);

    return {
      fundId: payload.fundId,
      facultyId: payload.facultyId,
      year: payload.year,
      remainingBudget: payload.remainingBudget,
      allocatedBudget: payload.allocatedBudget,
      totalBudget: payload.totalBudget,
    };
  }

  async topUpFund(fundId: string, amount: number): Promise<DepartmentFundBalanceResult> {
    const docRef = this.collection.doc(fundId);

    return admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new NotFoundException(`Department fund "${fundId}" not found for top-up.`);
      }

      const data = doc.data() ?? {};
      const newTotal = Number(data['totalBudget'] || 0) + amount;
      const newRemaining = Number(data['remainingBudget'] || 0) + amount;
      const timestampIso = new Date().toISOString();

      transaction.update(docRef, {
        totalBudget: admin.firestore.FieldValue.increment(amount),
        remainingBudget: admin.firestore.FieldValue.increment(amount),
        updatedAt: timestampIso,
      });

      return {
        fundId: doc.id,
        facultyId: data['facultyId'] as FacultyId,
        year: Number(data['year']),
        remainingBudget: newRemaining,
        allocatedBudget: Number(data['allocatedBudget'] || 0),
        totalBudget: newTotal,
      };
    });
  }

  private mapDoc(doc: admin.firestore.DocumentSnapshot): DepartmentFundBalanceResult {
    const data = doc.data() ?? {};
    return {
      fundId: doc.id,
      facultyId: data['facultyId'] as FacultyId,
      year: Number(data['year']),
      remainingBudget: Number(data['remainingBudget'] || 0),
      allocatedBudget: Number(data['allocatedBudget'] || 0),
      totalBudget: Number(data['totalBudget'] || 0),
    };
  }
}