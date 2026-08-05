import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from '@school-expense-ecosystem/finance/data-access-backend';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [],
})
export class FinanceBackendModule {}
