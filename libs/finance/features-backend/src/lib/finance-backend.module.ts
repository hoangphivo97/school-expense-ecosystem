import { Module } from '@nestjs/common';
import { BudgetBackendService, DepartmentFundRepository, FacultyRepository, FacultyService, FirestoreDepartmentFundRepository, FirestoreFacultyRepository,} from '@school-expense-ecosystem/finance/data-access-backend';
import { FacultyController } from './controllers/faculty.controller';

@Module({
  controllers: [FacultyController],
  providers: [BudgetBackendService, 
    FacultyService, {
    provide: FacultyRepository,
    useClass: FirestoreFacultyRepository
  },{
    provide: DepartmentFundRepository,
    useClass: FirestoreDepartmentFundRepository
  }],
  exports: [FacultyService, FacultyRepository, DepartmentFundRepository],
})
export class FinanceBackendModule { }
