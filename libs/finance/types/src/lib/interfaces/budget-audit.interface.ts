import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { BudgetReferenceDocType } from '../enums/budget-reference-doc.enum';
import { BudgetTransactionType } from '../enums/budget-transaction.enum';

/**
 * Snapshot of the Finance officer executing a budget mutation.
 */
export interface BudgetAuditActor {
  uid: string;
  email: string;
}

/**
 * Immutable ledger record stored in the `budget_audit_logs` Firestore collection.
 */
export interface BudgetAuditLog {
  id: string;
  fundId: string;
  facultyId: FacultyId;
  year: number;
  type: BudgetTransactionType;
  /** Signed delta amount: positive for allocations/top-ups, negative for deductions */
  amount: number;
  previousTotalBudget: number;
  newTotalBudget: number;
  previousRemainingBudget: number;
  newRemainingBudget: number;
  referenceDocType: BudgetReferenceDocType;
  referenceDocNo: string;
  reason: string;
  performedByUid: string;
  performedByEmail: string;
  createdAt: string;
}