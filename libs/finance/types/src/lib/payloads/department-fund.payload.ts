import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { BudgetReferenceDocType } from '../enums/budget-reference-doc.enum';
import { DepartmentFund } from '../interfaces/budget.interface';

/**
 * Shared audit metadata required for all institutional budget mutations.
 */
export interface AuditableBudgetPayload {
  referenceDocType: BudgetReferenceDocType;
  /** Official approval memo or dispatch number (e.g., 簽呈編號 / 核定文號) */
  referenceDocNo: string;
  /** Detailed justification for financial reconciliation */
  reason: string;
}

/**
 * HTTP request payload for initializing a department's annual budget.
 */
export interface InitializeDepartmentFundPayload extends AuditableBudgetPayload {
  facultyId: FacultyId;
  year: number;
  totalBudget: number;
}

/**
 * Firestore persistence payload constructed by the backend service upon fund initialization.
 */
export type CreateDepartmentFundPayload = DepartmentFund;

/**
 * Shared route parameter contract for targeting a specific department fund.
 */
export interface DepartmentFundParamsPayload {
  fundId: string;
}

/**
 * Shared HTTP request payload for modifying an existing department fund balance.
 */
export interface AdjustDepartmentFundPayload extends AuditableBudgetPayload {
  amount: number;
}

export type TopUpDepartmentFundPayload = AdjustDepartmentFundPayload;
export type DeductDepartmentFundPayload = AdjustDepartmentFundPayload;