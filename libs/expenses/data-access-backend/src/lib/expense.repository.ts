import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, PersonalExpenseRequestFilters, AnalyticsFilters, ExpenseAuditLogDocument, ReviewerExpenseRequestFilters } from '@school-expense-ecosystem/expenses/types';
import { AuthenticatedUser } from '@school-expense-ecosystem/shared/types';

export abstract class ExpenseRepository {
  abstract findPersonalExpensePaginated(filters: PersonalExpenseRequestFilters): Promise<PaginatedExpensesResponse>;
  abstract findById(id: string): Promise<ExpenseList | null>;
  abstract create(data: Omit<ExpenseList, 'id'>): Promise<ExpenseList>;
  abstract update(id: string, data: Partial<ExpenseList>): Promise<ExpenseList>;
  abstract findAvailableYears(userId: string): Promise<number[]>;
  abstract getAnalytics(filter: AnalyticsFilters): Promise<ExpenseAnalyticsDto>
  abstract createAuditLog(log: Omit<ExpenseAuditLogDocument, 'id'>): Promise<void>;
  abstract findReviewerExpensesPaginated(user: AuthenticatedUser, filter: ReviewerExpenseRequestFilters): Promise<PaginatedExpensesResponse>
}