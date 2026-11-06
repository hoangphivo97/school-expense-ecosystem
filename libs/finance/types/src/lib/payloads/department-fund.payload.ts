import { FacultyId } from "@school-expense-ecosystem/shared/types";

export interface CreateDepartmentFundPayload {
  fundId: string;
  facultyId: FacultyId;
  year: number;
  totalBudget: number;
  allocatedBudget: number;
  remainingBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface InitializeDepartmentFundPayload {
  facultyId: FacultyId;
  year: number;
  totalBudget: number;
}

export interface TopUpDepartmentFundPayload {
  amount: number;
}