import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { FirebaseExpenseRepository, ExpenseRepository, ExpenseBackendService, StorageProvider, LocalStorageAdapter } from '@school-expense-ecosystem/expenses/data-access-backend'; 

@Module({
  controllers: [ExpenseController],
  providers: [
    ExpenseBackendService,
    {
      provide: ExpenseRepository,
      useClass: FirebaseExpenseRepository,
    },
    {
      provide: StorageProvider,
      useClass: LocalStorageAdapter,
    }
  ],
  exports: [ExpenseBackendService],
})
export class ExpenseFeaturesBackendModule {}