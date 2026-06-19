import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInDb } from './interface/user-db.interface';
import { OnboardingDto } from './DTO/onboarding.dto';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';
import { AuthUserRepository } from './auth-user.repository';
import { IdentityProvider } from './interface/identify-provider.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authUser: AuthUserRepository,
    private readonly identityProvider: IdentityProvider
  ) { }

  async findByUid(uid: string): Promise<UserInDb | null> {
    return this.authUser.findByUid(uid);
  }

  async createUser(userData: UserInDb): Promise<UserInDb> {
    return this.authUser.createUser(userData);
  }

  generateJWT(user: UserInDb): string {
    const payload: UserInDb = {
      uid: user.uid,
      email: user.email, 
      username: user.username,
      role: user.role,
      facultyId: user.facultyId,
      userType: user.userType,
      status: user.status,
      fullName: user.fullName,
      createdAt: user.createdAt
    }
    return this.jwtService.sign(payload);
  }

  async handleFirebaseLogin(token: string): Promise<{ token: string; user: UserInDb }> {
    try {
      const decodedProfile = await this.identityProvider.verifyToken(token);
      const { uid, email, name } = decodedProfile;

      const userEmail = email ?? `no-email-${uid}@example.com`;

      let user = await this.authUser.findByUid(uid);

      if (!user) {
        user = await this.authUser.createUser({
          uid,
          email: userEmail,
          username: name ?? 'Unknown User',
          role: Role.LEVEL_3_USER,
          status: UserStatus.ONBOARDING,
          createdAt: new Date() 
        });
      }

      const authToken = this.generateJWT(user);
      return { token: authToken, user };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify session token or token expired');
    }
  }

  async completeOnboarding(uid: string, dto: OnboardingDto): Promise<UserInDb> {
    const user = await this.findByUid(uid);
    if (!user) {
      throw new NotFoundException('User profile not found in database.');
    }

    const updatedData: Partial<UserInDb> = {
      fullName: dto.fullName,
      facultyId: dto.facultyId,
      userType: dto.userType,
      userCode: dto.userCode,
      dateOfBirth: dto.dateOfBirth,
      status: UserStatus.PENDING || user.status
    };

    return this.authUser.updateUser(uid, updatedData);
  }
}

