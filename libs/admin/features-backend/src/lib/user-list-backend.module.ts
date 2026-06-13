import { Module } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { UserListController } from './user-list.controller';
import { UserRepository } from './user.repository';
import { FirebaseUserRepository } from './infrastructure/firebase-user.repository';

@Module({
  controllers: [UserListController],
  providers: [UserListService,
    {
      provide: UserRepository,
      useClass: FirebaseUserRepository
    }
  ],
  exports: [UserListService],
})
export class UserListBackendModule {}
