import { FacultyId, Role, UserType } from "@school-expense-ecosystem/auth/types";
import { AuditAction, ExpenseStatus, PaidMethod } from "../enums/expense.enum";

export interface ExpenseList {
  id: string;
  userId: string;
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
  history: AuditLogEntry[]
  requesterType: UserType;
  paidMethod: PaidMethod;
  date: string;
}

export type CreateExpenseInput = Pick<
  ExpenseList,
  'amount' | 'purpose' | 'description' | 'proofUrls'
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

export interface AuditLogEntry {
  actorId: string;
  actorName: string;
  actorRole: Role;
  actorType: UserType;
  actorCode: string;
  facultyId: FacultyId;
  action: AuditAction;
  status: ExpenseStatus;
  rejectReason?: string;
  createdAt: string;
  proofUrls: string[]
}

export interface AnalyticsFilters {
  year?: number;
  month?: number;
  role: Role;
  facultyId?: FacultyId;
}

export interface ExpenseFilters {
  userId: string;
  limit: number;
  pageToken?: string;
  year?: number;
  month?: number;
  searchTerm?: string;
}