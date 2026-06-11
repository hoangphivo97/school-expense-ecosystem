import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthDataAccessBackendModule } from '@school-expense-ecosystem/backend/auth/data-access';
import { AuthStatusGateway } from './gateways/auth-status.gateway';

@Module({
  imports: [AuthDataAccessBackendModule],
  controllers: [UserController],
  providers: [AuthStatusGateway],
  exports: [AuthStatusGateway]
})
export class AuthFeaturesBackendModule {}