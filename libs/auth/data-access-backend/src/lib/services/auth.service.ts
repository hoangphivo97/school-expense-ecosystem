import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CompleteOnboardingPayload, ConflictReason, IdentityProvider, OnboardingData } from '@school-expense-ecosystem/auth/types';
import { UserStatus, Role, UserBase, UserType } from '@school-expense-ecosystem/shared/types';
import { AccountRestrictedException } from '@school-expense-ecosystem/shared/utils-backend';
import { FirebaseError } from 'firebase/app';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { IdentityConflictClaimedException, IdentityConflictEmailException, InvalidTokenException, UserNotFoundException } from '../exceptions/auth.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authUserRepo: AuthUserRepository,
    private readonly identityProvider: IdentityProvider
  ) { }

  async findByUid(uid: string): Promise<UserBase | null> {
    return this.authUserRepo.findByUid(uid);
  }

  async createUser(userData: UserBase): Promise<UserBase> {
    return this.authUserRepo.createUser(userData);
  }

  generateJWT(user: UserBase): string {
    const payload: UserBase = {
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

  async handleFirebaseLogin(token: string): Promise<{ token: string; user: UserBase }> {
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
        throw new AccountRestrictedException(user.status, user.reason)
      }

      const authToken = this.generateJWT(user);
      return { token: authToken, user };
    } catch (error: unknown) {
      if (error instanceof AccountRestrictedException) {
        throw error; // Forward the structured restriction error object
      }

      const isFirebaseDisabled = (error as FirebaseError)?.code === 'auth/user-disabled' || (error as FirebaseError)?.message?.includes('disabled');
      if (isFirebaseDisabled) {
        throw new AccountRestrictedException(
          UserStatus.SUSPENDED,
          'This account has been explicitly suspended or disabled in the identity provider context.',
          'Access denied: Identity provider session has been terminated.'
        );
      }

      throw new InvalidTokenException()
    }
  }

  async completeOnboarding(uid: string, email: string, payload: CompleteOnboardingPayload) {
    const existingUser = await this.authUserRepo.findByUid(uid);

    if (!existingUser) {
      throw new UserNotFoundException();
    }

    if (existingUser.status !== UserStatus.ONBOARDING) {
      throw new AccountRestrictedException(
        existingUser.status,
        'User is not in ONBOARDING status.'
      );
    }

    const resolution = await this.authUserRepo.validateIdentityConflict({
      uid,
      email,
      userCode: payload.userCode // Mapped directly from frontend input boundaries
    });

    // 2. Terminate pipeline and throw explicit standard REST HTTP 409 exceptions upon conflict triggers
    if (resolution.isConflict) {
      if (resolution.reason === ConflictReason.EMWP) {
        throw new IdentityConflictEmailException(payload.userCode)
      }
      throw new IdentityConflictClaimedException(payload.userCode);
    }

    // 3. Assemble clean domain mutation payload strictly isolating structural parameters
    const onboardingPayload: OnboardingData = {
      fullName: payload.fullName,     // Derived from strict registration form configurations
      facultyId: payload.facultyId,   // Validated system enumeration references
      userType: UserType.STUDENT,
      userCode: payload.userCode,     // Unique organizational identifiers
      dateOfBirth: payload.dateOfBirth, // Core user identity metadata
    };

    // 4. Delegate transactional database commit execution
    await this.authUserRepo.executeOnboarding(
      uid,
      onboardingPayload,
      resolution.shouldLinkPreCreatedAccount
    );

    const updatedUser = await this.authUserRepo.findByUid(uid);
    if (!updatedUser) {
      throw new UserNotFoundException();
    }

    const token = this.generateJWT(updatedUser);

    return { token: token, user: updatedUser };
  }
}


