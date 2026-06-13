import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { ExpenseList, CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';

@Injectable()
export class ExpenseBackendService {
  constructor(private readonly expenseRepo: ExpenseRepository) {}

  async getExpensesForUser(userId: string, year?: number): Promise<ExpenseList[]> {
    return this.expenseRepo.findByUserId(userId, year);
  }

  async createExpense(userId: string, dto: CreateExpenseDto): Promise<ExpenseList> {
    return this.expenseRepo.create(userId, dto);
  }

  async updateExpense(id: string, userId: string, dto: UpdateExpenseDto): Promise<ExpenseList> {
    const existing = await this.expenseRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Expense listing with security ID ${id} not found.`);
    }
    return this.expenseRepo.update(id, dto);
  }

  async deleteExpense(id: string, userId: string): Promise<void> {
    const existing = await this.expenseRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Expense listing with security ID ${id} not found.`);
    }
    await this.expenseRepo.delete(id);
  }

  async getUserAvailableYears(userId: string): Promise<number[]> {
    return this.expenseRepo.findAvailableYears(userId);
  }
}