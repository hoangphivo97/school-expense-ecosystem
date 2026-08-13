import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@school-expense-ecosystem/shared/guards-backend';
import { BudgetBackendService, CreateBudgetDto } from '@school-expense-ecosystem/finance/data-access-backend';

@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetBackendService) { }


}