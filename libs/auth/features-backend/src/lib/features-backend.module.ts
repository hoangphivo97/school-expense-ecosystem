import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthDataAccessBackendModule } from '@school-expense-ecosystem/auth/data-access-backend';

@Module({
  imports: [AuthDataAccessBackendModule],
  controllers: [AuthController],
  providers: [],
  exports: []
})
export class AuthFeaturesBackendModule {}