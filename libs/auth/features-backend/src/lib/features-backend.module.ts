import { Module } from '@nestjs/common';
import { AuthDataAccessBackendModule } from '@school-expense-ecosystem/auth/data-access-backend';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [AuthDataAccessBackendModule],
  controllers: [AuthController],
  providers: [],
  exports: []
})
export class AuthFeaturesBackendModule {}