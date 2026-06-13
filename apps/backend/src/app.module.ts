import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthFeaturesBackendModule } from '@school-expense-ecosystem/auth/features-backend';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { FirestoreModule } from '@school-expense-ecosystem/shared/firestore';
import { ExpenseFeaturesBackendModule } from '@school-expense-ecosystem/expenses/feature-backend';


@Module({
  imports: [
    AuthFeaturesBackendModule,
    UserListBackendModule,
    FirestoreModule,
    ExpenseFeaturesBackendModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}