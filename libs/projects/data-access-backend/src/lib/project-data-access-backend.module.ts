import { Module } from '@nestjs/common';
import { ProjectRepository } from './repositories/abstracts/project.repository';
import { FirestoreProjectRepository } from './repositories/infrastructure/firebase-project.repository';
import { EventRepository } from './repositories/abstracts/event.repository';
import { FirebaseEventRepository } from './repositories/infrastructure/firebase-event.repository';

@Module({
  providers: [
    {
      provide: ProjectRepository,
      useClass: FirestoreProjectRepository,
    },
    {
      provide: EventRepository,
      useClass: FirebaseEventRepository,
    },
  ],
  exports: [ProjectRepository, EventRepository],
})
export class ProjectsDataAccessBackendModule {}