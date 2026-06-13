// libs/auth/features-backend/src/lib/auth.controller.ts
import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
// 🌟 ĐẢM BẢO: Chỉ import các thành phần Core nghiệp vụ cần thiết từ data-access
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
  async completeOnboarding(
    @Req() req: { user: { uid: string } }, 
    @Body() onboardingDto: OnboardingDto
  ) {
    const uid = req.user?.uid;

    if (!uid) {
      throw new UnauthorizedException('Invalid or expired active session.');
    }

    const updatedUser = await this.authService.completeOnboarding(uid, onboardingDto);

    const freshToken = this.authService.generateJWT(updatedUser);

    return {
      message: 'Onboarding data processed successfully.',
      token: freshToken,
      user: updatedUser
    };
  }
}