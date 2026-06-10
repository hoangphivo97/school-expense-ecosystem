import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthDataAccessBackendModule } from '@school-expense-ecosystem/backend/auth/data-access';

@Module({
  imports: [AuthDataAccessBackendModule],
  controllers: [UserController],
})
export class AuthFeaturesBackendModule {}