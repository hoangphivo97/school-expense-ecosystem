import { Module } from '@nestjs/common';
import { FirebaseUserRepository, FirestoreAuditLogRepository, IAdminAuditLogRepository, UserListBackendService, UserRepository } from '@school-expense-ecosystem/admin/data-access-backend';
import { UserListController } from './controllers/user-list.controller';

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
  exports: [UserListBackendService, UserRepository],
})
export class UserListBackendModule {}
