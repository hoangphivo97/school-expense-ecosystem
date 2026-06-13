import { ExpenseList, CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';

export abstract class ExpenseRepository {
  abstract findByUserId(userId: string, year?: number): Promise<ExpenseList[]>;
  abstract findById(id: string): Promise<ExpenseList | null>;
  abstract create(userId: string, data: CreateExpenseDto): Promise<ExpenseList>;
  abstract update(id: string, data: UpdateExpenseDto): Promise<ExpenseList>;
  abstract delete(id: string): Promise<void>;
  abstract findAvailableYears(userId: string): Promise<number[]>;
}