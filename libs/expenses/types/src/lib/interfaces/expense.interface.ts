// ... 1-2 lines above
import { FacultyId, UserType } from "@school-expense-ecosystem/shared/types";
import { PaidMethod } from "../enums/expense.enum";
import { ExpenseStatus } from "@school-expense-ecosystem/shared/types";

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