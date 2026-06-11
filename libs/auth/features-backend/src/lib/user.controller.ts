import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { LoginDto, UserService, UserInDb, OnboardingDto } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('login')
  async login(@Body('token') token: string) {
    const result = await this.userService.handleFirebaseLogin(token);
    return {
      message: 'Login success',
      ...result
    };
  }

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    const result = await this.userService.handleFirebaseLogin(token);
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
    const updatedUser = await this.userService.completeOnboarding(uid, onboardingDto);

    // Payload of old JWT contain old data(status: ONBOARDING, ...).
    // Create new token
    const freshToken = this.userService.generateJWT(updatedUser);

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
    let user = await this.userService.findByUid(uid);

    if (!user) {
      user = await this.userService.createUser({
        uid,
        email: userEmail,
        username: name ?? 'Unknown User',
        role: Role.LEVEL_3_USER,
        status: UserStatus.ONBOARDING
      });
    }

    const authToken = this.userService.generateJWT(user);
    return { token: authToken, user };
  }
}
