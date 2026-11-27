import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '@school-expense-ecosystem/auth/data-access-backend';
import { AppCheckGuard, Public, AllowStatuses, CurrentUser } from '@school-expense-ecosystem/shared/guards-backend';
import { OnboardingResponse, RevertOnboardingResponse } from '@school-expense-ecosystem/auth/types';
import { AuthenticatedUser, UserStatus } from '@school-expense-ecosystem/shared/types';
import { OnboardingDto } from '../dtos/onboarding.dto';

@Controller('auth')
@UseGuards(AppCheckGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private async authenticateWithFirebase(token: string) {
    const result = await this.authService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result,
    };
  }

  @Public()
  @Post('login')
  login(@Body('token') token: string) {
    return this.authenticateWithFirebase(token);
  }

  @Public()
  @Post('google-login')
  googleLogin(@Body('token') token: string) {
    return this.authenticateWithFirebase(token);
  }

  @Post('onboarding')
  @AllowStatuses(UserStatus.ONBOARDING, UserStatus.DRAFT)
  async completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OnboardingDto
  ): Promise<OnboardingResponse> {
    const result = await this.authService.completeOnboarding(user.uid, user.email, {
      fullName: dto.fullName,
      facultyId: dto.facultyId,
      userCode: dto.userCode,
      dateOfBirth: dto.dateOfBirth,
    });

    const message =
      result.user.status === UserStatus.ACTIVE
        ? 'Onboarding completed and account activated successfully.'
        : 'Onboarding completed successfully. Registration is now pending approval.';

    return {
      message,
      ...result,
    };
  }

  @Post('onboarding/revert')
  @AllowStatuses(UserStatus.PENDING)
  async revertOnboardingToDraft(
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RevertOnboardingResponse> {
    const result = await this.authService.revertOnboardingToDraft(user.uid);
    return {
      message: 'Onboarding status reverted to draft.',
      ...result,
    };
  }
}