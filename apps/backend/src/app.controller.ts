import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipAppCheck } from '@school-expense-ecosystem/auth/features-backend';
@Controller()
export class AppController {

  @Get('health')
  @SkipThrottle() 
  @SkipAppCheck() 
  getHealth() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }
}
