import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, OnboardingDto } from '@school-expense-ecosystem/auth/data-access-backend';
import { JwtAuthGuard , AppCheckGuard, Public} from '@school-expense-ecosystem/shared/guards-backend';
import { OnboardingResponse } from '@school-expense-ecosystem/auth/types';

@Controller('auth')
@UseGuards(AppCheckGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body('token') token: string) {
    const result = await this.authService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result
    };
  }

  @Public()
  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    const result = await this.authService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result
    };
  }

  @Post('onboarding')
  async completeOnboarding(@Req() req: any, @Body() dto: OnboardingDto): Promise<OnboardingResponse> {
    const firebaseUid = req.user.uid; 
    const email = req.user.email;

    const result = await this.authService.completeOnboarding(firebaseUid, email, dto);

    return {
    message: 'Onboarding completed successfully. Registration is now pending approval.',
    ...result
  };
  }
}