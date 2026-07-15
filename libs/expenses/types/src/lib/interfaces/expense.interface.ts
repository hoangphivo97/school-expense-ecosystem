import { BaseFilterParams, FacultyId, Role, UserType } from "@school-expense-ecosystem/shared/types";
import { PaidMethod } from "../enums/expense.enum";
import { PaginationParams, ExpenseStatus } from "@school-expense-ecosystem/shared/types";

export interface ExpenseList {
  id: string;
  userId: string;
  expenseCode: string;
  requesterCode: string;
  requesterName: string;
  facultyId: FacultyId;
  amount: number;
  purpose: string;
  description: string;
  proofUrls: string[];
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
  requesterType: UserType;
  paidMethod: PaidMethod;
  date: string;
}

export type CreateExpenseInput = Pick<
  ExpenseList,
  'amount' | 'purpose' | 'description' | 'proofUrls' | 'paidMethod'
>;

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface PaginatedExpensesResponse {
  expenses: ExpenseList[];
  nextPageToken: string | null;
  totalItems: number;
}

export interface ExpenseAnalyticsDto {
  kpis: {
    total: number;
    count: number;
    max: number;
    changePct: number | null;
  };
  pieData: { label: string; amount: number }[];
  lineData: { label: string; amount: number }[];
  barData: { label: string; amount: number }[];
}

export interface AnalyticsFilters extends Pick<FilterExpenseParams, "year" | "month" | "facultyId"> {
  role: Role;
}

export interface FilterExpenseParams extends BaseFilterParams {
  month?: number | null;
  year?: number | null;
  status?: ExpenseStatus | 'ALL' | null; // Typed accurately to represent business approval stages
  facultyId?: FacultyId;
  userType?: UserType;
}

export interface ExpenseRequestFilters extends FilterExpenseParams, PaginationParams {
  userId: string;
}
