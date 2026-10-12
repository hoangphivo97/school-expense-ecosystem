import { Faculty, FacultyId } from "@school-expense-ecosystem/shared/types";

export abstract class FacultyRepository {
  /**
   * Fetch all active faculties registered in the system
   */
  abstract findAllActive(): Promise<Faculty[]>;

  /**
   * Find single faculty by unique FacultyId code (e.g. 'FIT', 'FBE')
   */
  abstract findById(id: string): Promise<Faculty | null>;
  abstract getDepartmentFund(facultyId: FacultyId, year: number): Promise<{
    fundId: string;
    facultyId: FacultyId;
    year: number;
    remainingBudget: number;
    allocatedBudget: number;
    totalBudget: number;
  }>;
}