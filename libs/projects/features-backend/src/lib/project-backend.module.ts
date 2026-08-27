import { Module } from '@nestjs/common';
import { BudgetBackendService, } from '@school-expense-ecosystem/finance/data-access-backend';
import { ProjectController } from './controllers/project.controller';
import { EventRepository, EventService, FirebaseEventRepository, FirestoreProjectRepository, ProjectRepository, ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';

@Module({
  imports: [
    UserListBackendModule
  ],
  controllers: [ProjectController],
  providers: [BudgetBackendService,
    ProjectService,
    EventService,
    {
      provide: ProjectRepository,
      useClass: FirestoreProjectRepository
    },
    { provide: EventRepository, useClass: FirebaseEventRepository },
  ],
  exports: [ProjectService, EventService, ProjectRepository, EventRepository],
})
export class ProjectBackendModule { }
