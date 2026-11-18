import { Module } from '@nestjs/common';
import { BudgetBackendService, DepartmentFundRepository, FacultyRepository, FacultyService, FirestoreDepartmentFundRepository, FirestoreFacultyRepository, } from '@school-expense-ecosystem/finance/data-access-backend';
import { FacultyController } from './controllers/faculty.controller';
import { BudgetController } from './controllers/budget.controller';

@Module({
  controllers: [
    FacultyController, 
    BudgetController
  ],
  providers: [
    BudgetBackendService,
    FacultyService, 
    {
      provide: FacultyRepository,
      useClass: FirestoreFacultyRepository
    }, 
    {
      provide: DepartmentFundRepository,
      useClass: FirestoreDepartmentFundRepository
    }
  ],
  exports: [
    FacultyService, 
    FacultyRepository, 
    DepartmentFundRepository, 
    BudgetBackendService
  ],
})
export class FinanceBackendModule { }
