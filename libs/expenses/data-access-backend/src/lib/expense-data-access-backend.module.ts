import { Module } from '@nestjs/common';
import { ProjectsDataAccessBackendModule } from '@school-expense-ecosystem/projects/data-access-backend';
import { ExpenseBackendService } from './services/expense-backend.service';
import { ExpenseRepository } from './infrastructure/abtracts/expense.repository';
import { FirebaseExpenseRepository } from './infrastructure/infrastructure/firebase-expense.repository';
import { FirebaseStorageRepository } from './infrastructure/infrastructure/firebase-storage.repository';
import { StorageProviderRepository } from './infrastructure/abtracts/storage-provider.repository';

@Module({
  imports: [
    ProjectsDataAccessBackendModule,
  ],
  providers: [
    ExpenseBackendService,
    {
      provide: ExpenseRepository,
      useClass: FirebaseExpenseRepository,
    },
    {
      provide: StorageProviderRepository,
      useClass: FirebaseStorageRepository,
    },
  ],
  exports: [ExpenseBackendService, ExpenseRepository],
})
export class ExpensesDataAccessBackendModule {}