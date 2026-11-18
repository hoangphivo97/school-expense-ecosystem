import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { DepartmentFundRepository } from '../abstracts/department-fund.repository';
import { AdjustDepartmentFundPayload, AuditableBudgetPayload, BudgetAuditActor, BudgetAuditLog, BudgetLedgerSourceType, BudgetTransactionType, CreateDepartmentFundPayload, DepartmentFund, DepartmentFundStatus } from '@school-expense-ecosystem/finance/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class FirestoreDepartmentFundRepository implements DepartmentFundRepository {
  private readonly collection = admin.firestore().collection('department_funds');
  private readonly auditLogCollection = admin.firestore().collection('budget_audit_logs');

  async getDepartmentFund(
    facultyId: FacultyId,
    year: number
  ): Promise<DepartmentFund | null> {
    const fundId = `${facultyId.toUpperCase()}_DEPT_${year}`;
    return this.findById(fundId);
  }

  async findById(fundId: string): Promise<DepartmentFund | null> {
    const docSnap = await this.collection.doc(fundId).get();
    if (!docSnap.exists) {
      return null;
    }

    return this.mapDoc(docSnap);
  }

  async findAllByYear(year: number): Promise<DepartmentFund[]> {
    const snapshot = await this.collection.where('year', '==', year).get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => this.mapDoc(doc));
  }

  async createFund(
    payload: CreateDepartmentFundPayload,
    audit: AuditableBudgetPayload,
    actor: BudgetAuditActor
  ): Promise<DepartmentFund> {
    const docRef = this.collection.doc(payload.fundId);
    const auditLogRef = this.auditLogCollection.doc();

    return admin.firestore().runTransaction(async (transaction) => {
      const existing = await transaction.get(docRef);
      if (existing.exists) {
        throw new ConflictException(`Department fund "${payload.fundId}" already exists.`);
      }

      transaction.set(docRef, payload);

      const auditEntry: BudgetAuditLog = {
        id: auditLogRef.id,
        fundId: payload.fundId,
        facultyId: payload.facultyId,
        year: payload.year,
        type: BudgetTransactionType.INITIAL_ALLOCATION,
        sourceType: BudgetLedgerSourceType.MANUAL_FINANCE_ACTION,
        amount: payload.totalBudget,
        previousTotalBudget: 0,
        newTotalBudget: payload.totalBudget,
        previousAllocatedBudget: 0,
        newAllocatedBudget: 0,
        previousRemainingBudget: 0,
        newRemainingBudget: payload.totalBudget,
        referenceDocType: audit.referenceDocType,
        referenceDocNo: audit.referenceDocNo,
        reason: audit.reason,
        performedByUid: actor.uid,
        performedByEmail: actor.email,
        createdAt: payload.createdAt,
      };

      transaction.set(auditLogRef, auditEntry);

      return payload;
    });
  }

  async adjustFundBalance(
    fundId: string,
    type: BudgetTransactionType.TOP_UP | BudgetTransactionType.DEDUCTION,
    payload: AdjustDepartmentFundPayload,
    actor: BudgetAuditActor
  ): Promise<DepartmentFund> {
    const docRef = this.collection.doc(fundId);
    const auditLogRef = this.auditLogCollection.doc();
    const isDeduction = type === BudgetTransactionType.DEDUCTION;
    const delta = isDeduction ? -payload.amount : payload.amount;

    return admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new NotFoundException(`Department fund "${fundId}" not found.`);
      }

      const currentFund = this.mapDoc(doc);

      if (currentFund.status !== DepartmentFundStatus.ACTIVE) {
        throw new BadRequestException(
          `Cannot modify department fund "${fundId}" because its status is ${currentFund.status}.`
        );
      }

      // Solvency guard: Prevent deducting into funds already committed to approved activities
      if (isDeduction && payload.amount > currentFund.remainingBudget) {
        throw new BadRequestException(
          `Insufficient remaining budget. Available: ${currentFund.remainingBudget}, requested deduction: ${payload.amount}.`
        );
      }

      const newTotal = currentFund.totalBudget + delta;
      const newRemaining = currentFund.remainingBudget + delta;
      const timestampIso = new Date().toISOString();

      transaction.update(docRef, {
        totalBudget: newTotal,
        remainingBudget: newRemaining,
        updatedAt: timestampIso,
      });

      const auditEntry: BudgetAuditLog = {
        id: auditLogRef.id,
        fundId: currentFund.fundId,
        facultyId: currentFund.facultyId,
        year: currentFund.year,
        type,
        sourceType: BudgetLedgerSourceType.MANUAL_FINANCE_ACTION,
        amount: delta,
        previousTotalBudget: currentFund.totalBudget,
        newTotalBudget: newTotal,
        previousAllocatedBudget: currentFund.allocatedBudget,
        newAllocatedBudget: currentFund.allocatedBudget,
        previousRemainingBudget: currentFund.remainingBudget,
        newRemainingBudget: newRemaining,
        referenceDocType: payload.referenceDocType,
        referenceDocNo: payload.referenceDocNo,
        reason: payload.reason,
        performedByUid: actor.uid,
        performedByEmail: actor.email,
        createdAt: timestampIso,
      };

      transaction.set(auditLogRef, auditEntry);

      return {
        ...currentFund,
        totalBudget: newTotal,
        remainingBudget: newRemaining,
        updatedAt: timestampIso,
      };
    });
  }

  private mapDoc(doc: admin.firestore.DocumentSnapshot): DepartmentFund {
    const data = doc.data() ?? {};
    return {
      fundId: doc.id,
      facultyId: data['facultyId'] as FacultyId,
      year: Number(data['year']),
      totalBudget: Number(data['totalBudget'] || 0),
      allocatedBudget: Number(data['allocatedBudget'] || 0),
      remainingBudget: Number(data['remainingBudget'] || 0),
      status: (data['status'] as DepartmentFundStatus) ?? DepartmentFundStatus.ACTIVE,
      createdAt: String(data['createdAt'] ?? ''),
      updatedAt: String(data['updatedAt'] ?? ''),
    };
  }
}