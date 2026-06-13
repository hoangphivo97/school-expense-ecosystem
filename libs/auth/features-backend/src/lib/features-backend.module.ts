import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthDataAccessBackendModule } from '@school-expense-ecosystem/auth/data-access-backend';
import { AuthStatusGateway } from './gateways/auth-status.gateway';

@Module({
  imports: [AuthDataAccessBackendModule],
  controllers: [AuthController],
  providers: [AuthStatusGateway],
  exports: [AuthStatusGateway]
})
export class AuthFeaturesBackendModule {}