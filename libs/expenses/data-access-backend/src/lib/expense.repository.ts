import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, ExpenseRequestFilters, AnalyticsFilters, ExpenseAuditLogDocument } from '@school-expense-ecosystem/expenses/types';

export abstract class ExpenseRepository {
  abstract findPaginated(filters: ExpenseRequestFilters): Promise<PaginatedExpensesResponse>;
  abstract findById(id: string): Promise<ExpenseList | null>;
  abstract create(data: Omit<ExpenseList, 'id'>): Promise<ExpenseList>;
  abstract update(id: string, data: Partial<ExpenseList>): Promise<ExpenseList>;
  abstract findAvailableYears(userId: string): Promise<number[]>;
  abstract getAnalytics(filter: AnalyticsFilters): Promise<ExpenseAnalyticsDto>
  abstract createAuditLog(log: Omit<ExpenseAuditLogDocument, 'id'>): Promise<void>;
}