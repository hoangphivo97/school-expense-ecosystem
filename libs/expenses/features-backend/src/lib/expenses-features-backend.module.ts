import { Module } from '@nestjs/common';
import { ExpenseController } from './controllers/expense.controller';
import { ExpensesDataAccessBackendModule } from '@school-expense-ecosystem/expenses/data-access-backend';

@Module({
  imports: [ExpensesDataAccessBackendModule],
  controllers: [ExpenseController],
  exports: [],
})
export class ExpenseFeaturesBackendModule { }