import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {  DepartmentFundBalanceResult, FacultyId } from '@school-expense-ecosystem/shared/types';
import { DepartmentFundRepository } from '../abstracts/department-fund.repository';

@Injectable()
export class FirestoreDepartmentFundRepository implements DepartmentFundRepository {
  private readonly collection = admin.firestore().collection('department_funds');

  async getDepartmentFund(facultyId: FacultyId, year: number): Promise<DepartmentFundBalanceResult | null> {
    const fundId = `${facultyId.toUpperCase()}_DEPT_${year}`;
    const docSnap = await this.collection.doc(fundId).get();

    if (!docSnap.exists) {
      return null;
    }

    return {
      fundId: docSnap.id,
      ...(docSnap.data() as Omit<DepartmentFundBalanceResult, 'id'>),
    };
  }
}