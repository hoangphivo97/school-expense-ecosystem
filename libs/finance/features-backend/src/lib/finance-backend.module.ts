import { Module } from '@nestjs/common';
import { BudgetController } from './controllers/budget.controller';
import { BudgetBackendService, FirestoreProjectRepository, ProjectBackendService } from '@school-expense-ecosystem/finance/data-access-backend';
import { ProjectController } from './controllers/project.controller';
import { ProjectRepository } from '../../../data-access-backend/src/lib/project.repository';

@Module({
  controllers: [BudgetController, ProjectController],
  providers: [BudgetBackendService, 
    ProjectBackendService, {
    provide: ProjectRepository,
    useClass: FirestoreProjectRepository
  }],
  exports: [ProjectBackendService],
})
export class FinanceBackendModule { }
