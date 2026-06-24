import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppCheckGuard, AuthFeaturesBackendModule, CustomThrottlerGuard, JwtAuthGuard } from '@school-expense-ecosystem/auth/features-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { FirestoreModule } from '@school-expense-ecosystem/shared/firestore';
import { ExpenseFeaturesBackendModule } from '@school-expense-ecosystem/expenses/feature-backend';
import { APP_GUARD } from '@nestjs/core';
import { throttlerConfig } from './app.security-config';
import { ThrottlerModule } from '@nestjs/throttler';


@Module({
  imports: [
    AuthFeaturesBackendModule,
    UserListBackendModule,
    FirestoreModule,
    ExpenseFeaturesBackendModule,
    ThrottlerModule.forRoot(throttlerConfig),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AppCheckGuard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}