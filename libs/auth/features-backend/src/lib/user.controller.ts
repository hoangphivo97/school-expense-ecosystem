import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { LoginDto, UserService, UserInDb } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const validatedUser = await this.userService.validateUser(loginDto.email, loginDto.password);
    const authToken = this.userService.generateJWT(validatedUser);

    return { 
      message: 'Login success', 
      token: authToken, 
      user: validatedUser 
    };
  }

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    try {
      const result = await this.handleFirebaseLogin(token);
      return { message: 'Login success', ...result };
    } catch (error) {
      throw new UnauthorizedException('Google federation identity provider verification failed.');
    }
  }

  // @Post('facebook-login')
  // async facebookLogin(@Body('token') token: string) {
  //   try {
  //     const result = await this.handleFirebaseLogin(token);
  //     return { message: 'Login success', ...result };
  //   } catch (error) {
  //     throw new UnauthorizedException('Facebook federation identity provider verification failed.');
  //   }
  // }

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
