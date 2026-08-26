import { Faculty } from "@school-expense-ecosystem/shared/types";

export abstract class FacultyRepository {
  /**
   * Fetch all active faculties registered in the system
   */
  abstract findAllActive(): Promise<Faculty[]>;

  /**
   * Find single faculty by unique FacultyId code (e.g. 'FIT', 'FBE')
   */
  abstract findById(id: string): Promise<Faculty | null>;
}