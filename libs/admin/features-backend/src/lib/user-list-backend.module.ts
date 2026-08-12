import { Module } from '@nestjs/common';
import { UserListBackendService } from './user-list.service';
import { UserListController } from './user-list.controller';
import { UserRepository } from './repository/user.repository';
import { FirebaseUserRepository } from './infrastructure/firebase-user.repository';
import { FirestoreAuditLogRepository } from './infrastructure/firebase-audit-log.repository';
import { IAdminAuditLogRepository } from './repository/audit-log.repository';

@Module({
  controllers: [UserListController],
  providers: [UserListBackendService,
    {
      provide: UserRepository,
      useClass: FirebaseUserRepository
    },
    {
      provide: IAdminAuditLogRepository,
      useClass: FirestoreAuditLogRepository,
    },
  ],
  exports: [UserListBackendService],
})
export class UserListBackendModule {}
