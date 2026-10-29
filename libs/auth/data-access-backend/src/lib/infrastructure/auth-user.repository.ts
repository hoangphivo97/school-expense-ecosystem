import { IAuthIdentityCheck, IConflictResolution } from '@school-expense-ecosystem/auth/types';
import { UserBase } from '@school-expense-ecosystem/shared/types';

export abstract class AuthUserRepository {
  abstract findByUid(uid: string): Promise<UserBase | null>;
  abstract createUser(userData: UserBase): Promise<UserBase>;
  abstract updateUser(uid: string, updateData: Partial<UserBase>): Promise<UserBase>;
  abstract validateIdentityConflict(check: IAuthIdentityCheck): Promise<IConflictResolution>;
  abstract executeOnboarding(uid: string, data: any, shouldLink: boolean): Promise<void>;
}