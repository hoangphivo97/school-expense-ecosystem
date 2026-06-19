import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, OnboardingDto } from '@school-expense-ecosystem/auth/data-access-backend';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body('token') token: string) {
    const result = await this.authService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result
    };
  }

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    const result = await this.authService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result
    };
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(@Req() req: any, @Body() dto: OnboardingDto) {
    const firebaseUid = req.user.uid; 
    const email = req.user.email;

    return await this.authService.completeOnboarding(firebaseUid, email, dto);
  }
}