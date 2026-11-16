import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { BudgetReferenceDocType } from '../enums/budget-reference-doc.enum';
import { BudgetTransactionType } from '../enums/budget-transaction.enum';
import { BudgetLedgerSourceType } from '../enums/budget-ledger-source.enum';

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
  sourceType: BudgetLedgerSourceType;
  /** Target Project ID or Event ID when sourceType is PROJECT or EVENT */
  sourceEntityId?: string;
  /** Signed delta amount affecting remainingBudget */
  amount: number;
  previousTotalBudget: number;
  newTotalBudget: number;
  previousAllocatedBudget: number;
  newAllocatedBudget: number;
  previousRemainingBudget: number;
  newRemainingBudget: number;
  /** Required for manual Finance mutations; optional for automated Project/Event lifecycle events */
  referenceDocType?: BudgetReferenceDocType;
  referenceDocNo?: string;
  reason: string;
  performedByUid: string;
  performedByEmail: string;
  createdAt: string;
}