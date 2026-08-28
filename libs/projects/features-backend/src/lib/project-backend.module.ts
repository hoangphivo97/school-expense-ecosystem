import { Module } from '@nestjs/common';
import { BudgetBackendService, } from '@school-expense-ecosystem/finance/data-access-backend';
import { ProjectController } from './controllers/project.controller';
import { EventRepository, EventService, FirebaseEventRepository, FirestoreProjectRepository, ProjectRepository, ProjectService, SharedService } from '@school-expense-ecosystem/projects/data-access-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { EventController } from './controllers/event.controller';

@Module({
  imports: [
    UserListBackendModule
  ],
  controllers: [ProjectController, EventController],
  providers: [BudgetBackendService,
    ProjectService,
    EventService,
    SharedService,
    {
      provide: ProjectRepository,
      useClass: FirestoreProjectRepository
    },
    { provide: EventRepository, useClass: FirebaseEventRepository },
  ],
  exports: [ProjectService, EventService, ProjectRepository, EventRepository],
})
export class ProjectBackendModule { }
