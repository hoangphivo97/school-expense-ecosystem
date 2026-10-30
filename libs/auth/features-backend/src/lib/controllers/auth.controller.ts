import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '@school-expense-ecosystem/auth/data-access-backend';
import { AppCheckGuard, Public, AllowStatuses, CurrentUser } from '@school-expense-ecosystem/shared/guards-backend';
import { OnboardingResponse } from '@school-expense-ecosystem/auth/types';
import { AuthenticatedUser, UserStatus } from '@school-expense-ecosystem/shared/types';
import { OnboardingDto } from '../dtos/onboarding.dto';

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
  @AllowStatuses(UserStatus.ONBOARDING)
  async completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: OnboardingDto): Promise<OnboardingResponse> {
    const payload = {
      fullName: dto.fullName,
      facultyId: dto.facultyId,
      userCode: dto.userCode,
      dateOfBirth: dto.dateOfBirth
    };

    const result = await this.authService.completeOnboarding(user.uid, user.email, payload);

    const isApproved = result.user.status === UserStatus.ACTIVE;
    const message = isApproved
      ? 'Onboarding completed and account activated successfully.'
      : 'Onboarding completed successfully. Registration is now pending approval.';

    return {
      message,
      token: result.token,
      user: result.user
    };
  }
}