import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { FirebaseExpenseRepository, ExpenseRepository, ExpenseBackendService } from '@school-expense-ecosystem/expenses/data-access-backend'; 

@Module({
  controllers: [ExpenseController],
  providers: [
    ExpenseBackendService,
    {
      provide: ExpenseRepository,
      useClass: FirebaseExpenseRepository,
    },
  ],
  exports: [ExpenseBackendService],
})
export class ExpenseFeaturesBackendModule {}