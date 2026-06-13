import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { LoginDto, AuthService, UserInDb, OnboardingDto } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';
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
  async completeOnboarding(@Req() req: any, @Body() onboardingDto: OnboardingDto) {

    const uid = req.user?.uid;

    if (!uid) {
      throw new UnauthorizedException('Invalid or expired active session.');
    }

    // 1. Attempt call Service to update DB
    const updatedUser = await this.authService.completeOnboarding(uid, onboardingDto);

    // Payload of old JWT contain old data(status: ONBOARDING, ...).
    // Create new token
    const freshToken = this.authService.generateJWT(updatedUser);

    return {
      message: 'Onboarding data processed successfully.',
      token: freshToken,
      user: updatedUser
    };
  }

  private async handleFirebaseLogin(
    token: string,
  ): Promise<{ token: string; user: UserInDb }> {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    const userEmail = email ?? `no-email-${uid}@example.com`;
    let user = await this.authService.findByUid(uid);

    if (!user) {
      user = await this.authService.createUser({
        uid,
        email: userEmail,
        username: name ?? 'Unknown User',
        role: Role.LEVEL_3_USER,
        status: UserStatus.ONBOARDING
      });
    }

    const authToken = this.authService.generateJWT(user);
    return { token: authToken, user };
  }
}
