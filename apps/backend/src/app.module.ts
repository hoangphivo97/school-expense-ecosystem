import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthFeaturesBackendModule } from '@school-expense-ecosystem/backend/auth/features';
import { UserListBackendModule } from '@school-expense-ecosystem/admin/features-backend';
import { FirestoreModule } from '@school-expense-ecosystem/shared/firestore';

@Module({
  imports: [
    AuthFeaturesBackendModule,
    UserListBackendModule,
    FirestoreModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}