import { DepartmentFundBalanceResult, FacultyId } from '@school-expense-ecosystem/shared/types';

export abstract class DepartmentFundRepository {
  abstract getDepartmentFund(facultyId: FacultyId, year: number): Promise<DepartmentFundBalanceResult | null>;
}