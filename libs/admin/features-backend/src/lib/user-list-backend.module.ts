import { Module } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { UserListController } from './user-list.controller';
import { UserRepository } from './user.repository';
import { FirebaseUserRepository } from '@school-expense-ecosystem/shared/firestore';

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
