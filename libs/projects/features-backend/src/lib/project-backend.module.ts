import { Module } from '@nestjs/common';
import { BudgetBackendService,} from '@school-expense-ecosystem/finance/data-access-backend';
import { ProjectController } from './controllers/project.controller';
import { FirestoreProjectRepository, ProjectRepository, ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';

@Module({
  controllers: [ProjectController],
  providers: [BudgetBackendService, 
    ProjectService, {
    provide: ProjectRepository,
    useClass: FirestoreProjectRepository
  }],
  exports: [ProjectService],
})
export class ProjectBackendModule { }
