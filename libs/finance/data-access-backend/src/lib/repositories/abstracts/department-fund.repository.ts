import { CreateDepartmentFundPayload } from '@school-expense-ecosystem/finance/types';
import { DepartmentFundBalanceResult, FacultyId } from '@school-expense-ecosystem/shared/types';

export abstract class DepartmentFundRepository {
  abstract getDepartmentFund(facultyId: FacultyId, year: number): Promise<DepartmentFundBalanceResult | null>;
  abstract findById(fundId: string): Promise<DepartmentFundBalanceResult | null>;
  abstract findAllByYear(year: number): Promise<DepartmentFundBalanceResult[]>;
  abstract createFund(payload: CreateDepartmentFundPayload): Promise<DepartmentFundBalanceResult>;
  abstract topUpFund(fundId: string, amount: number): Promise<DepartmentFundBalanceResult>;
}