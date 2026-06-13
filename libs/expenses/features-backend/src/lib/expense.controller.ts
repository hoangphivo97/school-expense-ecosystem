import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ExpenseBackendService } from '@school-expense-ecosystem/expenses/data-access-backend';
import { JwtAuthGuard } from '@school-expense-ecosystem/auth/features-backend';
import { CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseBackendService) {}

  @Get()
  async getExpenses(@Req() req: any, @Query('year') year?: string) {
    const userId = req.user.uid;
    const filterYear = year ? parseInt(year, 10) : undefined;
    return this.expenseService.getExpensesForUser(userId, filterYear);
  }

  @Get('years')
  async getAvailableYears(@Req() req: any) {
    return this.expenseService.getUserAvailableYears(req.user.uid);
  }

  @Post()
  async createExpense(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.expenseService.createExpense(req.user.uid, dto);
  }

  @Put(':id')
  async updateExpense(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.updateExpense(id, req.user.uid, dto);
  }

  @Delete(':id')
  async deleteExpense(@Req() req: any, @Param('id') id: string) {
    await this.expenseService.deleteExpense(id, req.user.uid);
    return { success: true, message: 'Expense allocation deleted successfully.' };
  }
}