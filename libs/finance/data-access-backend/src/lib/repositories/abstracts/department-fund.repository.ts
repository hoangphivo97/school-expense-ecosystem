import { AdjustDepartmentFundPayload, AuditableBudgetPayload, BudgetAuditActor, BudgetTransactionType, CreateDepartmentFundPayload, DepartmentFund } from '@school-expense-ecosystem/finance/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

export abstract class DepartmentFundRepository {
  abstract getDepartmentFund(facultyId: FacultyId, year: number): Promise<DepartmentFund | null>;
  abstract findById(fundId: string): Promise<DepartmentFund | null>;
  abstract findAllByYear(year: number): Promise<DepartmentFund[]>;
  abstract createFund(
    payload: CreateDepartmentFundPayload,
    audit: AuditableBudgetPayload,
    actor: BudgetAuditActor
  ): Promise<DepartmentFund>;

  abstract adjustFundBalance(
    fundId: string,
    type: BudgetTransactionType.TOP_UP | BudgetTransactionType.DEDUCTION,
    payload: AdjustDepartmentFundPayload,
    actor: BudgetAuditActor
  ): Promise<DepartmentFund>;
}