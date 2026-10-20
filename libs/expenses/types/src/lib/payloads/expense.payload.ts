import { BaseFilterParams, CursorPaginationParams, ExpenseStatus, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { ExpenseList } from '../interfaces/expense.interface';

// Base creation payload extracting writable fields from ExpenseList
export type CreateExpensePayload = Pick<
  ExpenseList,
  'amount' | 'purpose' | 'description' | 'proofUrls' | 'paidMethod'
>;

// Partial mutation payload
export type UpdateExpensePayload = Partial<CreateExpensePayload>;

// Base filter parameters for expense queries
export interface FilterExpenseParams extends BaseFilterParams {
  month?: number | null;
  year?: number | null;
  status?: ExpenseStatus | 'ALL' | null;
  facultyId?: FacultyId;
  userType?: UserType;
}

// Reviewer query payload with cursor pagination
export type ReviewerExpenseQueryPayload = FilterExpenseParams & CursorPaginationParams;

// Personal query payload with explicit user ownership scoping
export type PersonalExpenseQueryPayload = FilterExpenseParams & CursorPaginationParams & {
  userId: string;
};

// Internal analytics filtering criteria scoped by role
export interface ExpenseAnalyticsFilters extends Pick<FilterExpenseParams, 'year' | 'month' | 'facultyId'> {
  role: Role;
}

// Backward-compatibility aliases for existing backend services
export type CreateExpenseInput = CreateExpensePayload;
export type UpdateExpenseInput = UpdateExpensePayload;
export type ReviewerExpenseRequestFilters = ReviewerExpenseQueryPayload;
export type PersonalExpenseRequestFilters = PersonalExpenseQueryPayload;
export type AnalyticsFilters = ExpenseAnalyticsFilters;