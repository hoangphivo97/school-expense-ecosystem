import { ExpenseList, CreateExpenseDto, UpdateExpenseDto, PaginatedExpensesResponse, ExpenseAnalyticsDto } from '@school-expense-ecosystem/expenses/types';

export abstract class ExpenseRepository {
  abstract findPaginated(filters: { userId: string; year?: number; month?: number; limit: number; pageToken?: string, searchTerm?: string }): Promise<PaginatedExpensesResponse>;
  abstract findById(id: string): Promise<ExpenseList | null>;
  abstract create(userId: string, data: CreateExpenseDto): Promise<ExpenseList>;
  abstract update(id: string, data: UpdateExpenseDto): Promise<ExpenseList>;
  abstract delete(id: string): Promise<void>;
  abstract findAvailableYears(userId: string): Promise<number[]>;
  abstract getAnalytics(filters: {
    year?: number;
    month?: number;
    role: string;
    facultyId?: string
  }): Promise<ExpenseAnalyticsDto>
}