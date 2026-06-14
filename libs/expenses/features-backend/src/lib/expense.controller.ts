import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ExpenseBackendService } from '@school-expense-ecosystem/expenses/data-access-backend';
import { JwtAuthGuard } from '@school-expense-ecosystem/auth/features-backend';
import { CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseBackendService) { }

  @Get()
  async getExpenses(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('pageToken') pageToken?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('searchTerm') searchTerm?: string
  ) {
    const userId = req.user.uid;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const filterYear = year ? parseInt(year, 10) : undefined;
    const filterMonth = month ? parseInt(month, 10) : undefined;

    return this.expenseService.getPaginatedExpenses(userId, {
      limit: parsedLimit,
      pageToken,
      year: filterYear,
      month: filterMonth,
      searchTerm: searchTerm || undefined
    });
  }

  @Get('analytics')
  async getAnalytics(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {

    const { role, facultyId } = req.user;
    const filterYear = year ? parseInt(year, 10) : undefined;
    const filterMonth = month ? parseInt(month, 10) : undefined;

    return this.expenseService.getExpenseAnalytics(req.user.uid, role, facultyId, filterYear, filterMonth);
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