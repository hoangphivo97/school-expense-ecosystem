import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthFeaturesBackendModule } from '@school-expense-ecosystem/backend/auth/features';

@Module({
  imports: [
    AuthFeaturesBackendModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}