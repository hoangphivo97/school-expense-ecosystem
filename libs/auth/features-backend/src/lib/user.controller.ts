import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto, UserService } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';
import { UserInDb } from '@school-expense-ecosystem/auth/data-access';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const validatedUser = await this.userService.validateUser(loginDto.username, loginDto.password);

    return this.userService.login(validatedUser);
  }

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    try {
      const result = await this.handleFirebaseLogin(token);
      return { message: 'Login success', ...result };
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }

  @Post('facebook-login')
  async facebookLogin(@Body('token') token: string) {
    try {
      const result = await this.handleFirebaseLogin(token);
      return { message: 'Login success', ...result };
    } catch (error) {
      throw new Error('Authentication failed');
    }
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
        role: 'User',
      });
    }

    const authToken = this.userService.generateJWT(user);
    return { token: authToken, user };
  }
}
