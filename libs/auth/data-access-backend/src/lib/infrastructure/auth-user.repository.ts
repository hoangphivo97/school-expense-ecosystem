import { IAuthIdentityCheck, IConflictResolution, OnboardingData } from '@school-expense-ecosystem/auth/types';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';

export type StatusTransitionResult =
  | { outcome: 'SUCCESS'; user: UserBase }
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'STATUS_MISMATCH'; currentStatus: UserStatus };
  
export abstract class AuthUserRepository {
  abstract findByUid(uid: string): Promise<UserBase | null>;
  abstract createUser(userData: UserBase): Promise<UserBase>;
  abstract updateUser(uid: string, updateData: Partial<UserBase>): Promise<UserBase>;
  abstract validateIdentityConflict(check: IAuthIdentityCheck): Promise<IConflictResolution>;
  abstract executeOnboarding(uid: string, data: OnboardingData, shouldLink: boolean): Promise<void>;
  abstract transitionStatusAtomic(
    uid: string,
    allowedCurrentStatuses: UserStatus[],
    nextStatus: UserStatus
  ): Promise<StatusTransitionResult>;
}