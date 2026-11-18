import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { DepartmentFundStatus } from "../enums/department-fund-status.enum";

export interface DepartmentFund {
  fundId: string;
  facultyId: FacultyId;
  year: number;
  /** Total approved budget ceiling for the fiscal year (totalBudget = allocatedBudget + remainingBudget) */
  totalBudget: number;
  /** Funds already earmarked or committed to approved departmental activities */
  allocatedBudget: number;
  /** Uncommitted balance available for future commitments or deductions */
  remainingBudget: number;
  status: DepartmentFundStatus;
  createdAt: string;
  updatedAt: string;
}