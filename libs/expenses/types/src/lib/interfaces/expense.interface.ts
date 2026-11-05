import { FacultyId, UserType } from "@school-expense-ecosystem/shared/types";
import { ExcessHandlingOption, PaidMethod } from "../enums/expense.enum";
import { ExpenseStatus } from "@school-expense-ecosystem/shared/types";
import { ActivityType } from "@school-expense-ecosystem/projects/types";

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
  activityId:string;
  activityType: ActivityType;
  approvedAmount?: number;
  actualInvoiceAmount?: number;
  settlementAmount?: number;
  excessHandling?: ExcessHandlingOption | null;
  excessReason?: string | null;
  procurementDeadline?: string | null;
  teacherApprovedAt?: string | null;
  deanApprovedAt?: string | null;
  settledAt?: string | null;
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