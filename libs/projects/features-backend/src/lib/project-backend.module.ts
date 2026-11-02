import { Module } from '@nestjs/common';
import { BudgetBackendService, } from '@school-expense-ecosystem/finance/data-access-backend';
import { ProjectController } from './controllers/project.controller';
import { EventRepository, EventService, FirebaseEventRepository, FirestoreProjectRepository, JoinCodeService, ProjectRepository, ProjectsDataAccessBackendModule, ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { EventController } from './controllers/event.controller';

@Module({
  imports: [
    UserListBackendModule,
    ProjectsDataAccessBackendModule
  ],
  controllers: [ProjectController, EventController],
  providers: [BudgetBackendService,
    ProjectService,
    EventService,
    JoinCodeService,
  ],
  exports: [ProjectService, EventService, ProjectRepository, EventRepository],
})
export class ProjectBackendModule { }
