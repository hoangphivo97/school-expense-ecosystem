import { ExpenseList, CreateExpenseDto, UpdateExpenseDto, PaginatedExpensesResponse, ExpenseAnalyticsDto, ExpenseFilters, AnalyticsFilters } from '@school-expense-ecosystem/expenses/types';

export abstract class ExpenseRepository {
  abstract findPaginated(filters: ExpenseFilters): Promise<PaginatedExpensesResponse>;
  abstract findById(id: string): Promise<ExpenseList | null>;
  abstract create(data: Omit<ExpenseList, 'id'>): Promise<ExpenseList>;
  abstract update(id: string, data: Partial<ExpenseList> & { logEntry?: any }): Promise<ExpenseList>;
  abstract findAvailableYears(userId: string): Promise<number[]>;
  abstract getAnalytics(filter: AnalyticsFilters): Promise<ExpenseAnalyticsDto>
}