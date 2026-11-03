import { Module } from '@nestjs/common';

import { ProjectController } from './controllers/project.controller';
import { EventService, JoinCodeService, ProjectsDataAccessBackendModule, ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { EventController } from './controllers/event.controller';

@Module({
  imports: [
    UserListBackendModule,
    ProjectsDataAccessBackendModule
  ],
  controllers: [ProjectController, EventController],
  providers: [
    ProjectService,
    EventService,
    JoinCodeService,
  ],
  exports: [ProjectService, EventService],
})
export class ProjectBackendModule { }
