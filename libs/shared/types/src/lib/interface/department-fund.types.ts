import { FacultyId } from "../enums/user.enum";

export type DepartmentFundBalanceResult =
  | {
    facultyId: FacultyId;
    year: number;
    remainingBudget: number;
  }
  | {
    fundId: string;
    facultyId: FacultyId;
    year: number;
    remainingBudget: number;
    allocatedBudget: number;
    totalBudget: number;
  };