import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInDb } from './interface/user-db.interface';
import { OnboardingDto } from './DTO/onboarding.dto';
import { ConflictReason, OnboardingData } from '@school-expense-ecosystem/auth/types';
import { AuthUserRepository } from './auth-user.repository';
import { IdentityProvider } from './interface/identify-provider.interface';
import { UserStatus, Role, RestrictedAccountError } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authUserRepo: AuthUserRepository,
    private readonly identityProvider: IdentityProvider
  ) { }

  async findByUid(uid: string): Promise<UserInDb | null> {
    return this.authUserRepo.findByUid(uid);
  }

  async createUser(userData: UserInDb): Promise<UserInDb> {
    return this.authUserRepo.createUser(userData);
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

      let user = await this.authUserRepo.findByUid(uid);

      if (!user) {
        user = await this.authUserRepo.createUser({
          uid,
          email: userEmail,
          username: name ?? 'Unknown User',
          role: Role.LEVEL_3_USER,
          status: UserStatus.ONBOARDING,
          createdAt: new Date()
        });
      }

      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.REJECTED) {
        const restrictionError: RestrictedAccountError = {
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: 'AUTH_ACCOUNT_RESTRICTED',
          errorMsg: 'Access denied: Your account scope has been restricted by system policies.',
          userStatus: user.status,
          reason: user.reason || 'Access restricted by the institution administrator due to policy compliance.'
        }
        throw new ForbiddenException(restrictionError);
      }

      const authToken = this.generateJWT(user);
      return { token: authToken, user };
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error; // Forward the structured restriction error object
      }

      const isFirebaseDisabled = error?.code === 'auth/user-disabled' || error?.message?.includes('disabled');
      if (isFirebaseDisabled) {
        const restrictionError: RestrictedAccountError = {
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: 'AUTH_ACCOUNT_RESTRICTED',
          errorMsg: 'Access denied: Identity provider session has been terminated.',
          userStatus: UserStatus.SUSPENDED,
          reason: 'This account has been explicitly suspended or disabled in the identity provider context.'
        }

        throw new ForbiddenException(restrictionError);
      }

      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'AUTH_INVALID_TOKEN',
        message: 'Authentication failed: Failed to verify session token or token expired.',
      });
    }
  }

  async completeOnboarding(uid: string, email: string, dto: OnboardingDto) {
    // 1. Dispatch identity conflict assessment via context-aware abstraction layer
    const resolution = await this.authUserRepo.validateIdentityConflict({
      uid,
      email,
      userCode: dto.userCode // Mapped directly from frontend input boundaries
    });

    // 2. Terminate pipeline and throw explicit standard REST HTTP 409 exceptions upon conflict triggers
    if (resolution.isConflict) {
      if (resolution.reason === ConflictReason.EMWP) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'AUTH_IDENTITY_CONFLICT_EMAIL',
          message: `Security Violation: The User Code '${dto.userCode}' is exclusively allocated to a different email address structure.`,
        })
      }
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'AUTH_IDENTITY_CONFLICT_CLAIMED',
        message: `Identity Conflict: The User Code '${dto.userCode}' has already been claimed by another active verified system user.`,
      });
    }

    // 3. Assemble clean domain mutation payload strictly isolating structural parameters
    const onboardingPayload: OnboardingData = {
      fullName: dto.fullName,     // Derived from strict registration form configurations
      facultyId: dto.facultyId,   // Validated system enumeration references
      userType: dto.userType,     // Access tier categorizations
      userCode: dto.userCode,     // Unique organizational identifiers
      dateOfBirth: dto.dateOfBirth, // Core user identity metadata
    };

    // 4. Delegate transactional database commit execution
    await this.authUserRepo.executeOnboarding(
      uid,
      onboardingPayload,
      resolution.shouldLinkPreCreatedAccount
    );

    const updatedUser = await this.authUserRepo.findByUid(uid);
    if (!updatedUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'AUTH_USER_NOT_FOUND',
        message: 'User record could not be retrieved after onboarding.',
      });
    }

    const token = this.generateJWT(updatedUser);

    return { token: token, user: updatedUser };
  }
}


