import { Module } from '@nestjs/common';
import { BudgetBackendService, FacultyRepository, FacultyService, FirestoreFacultyRepository,} from '@school-expense-ecosystem/finance/data-access-backend';
import { FirestoreProjectRepository, ProjectRepository, ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { FacultyController } from './controllers/faculty.controller';

@Module({
  controllers: [FacultyController],
  providers: [BudgetBackendService, 
    FacultyService, {
    provide: FacultyRepository,
    useClass: FirestoreFacultyRepository
  }],
  exports: [FacultyService, FacultyRepository],
})
export class FinanceBackendModule { }
