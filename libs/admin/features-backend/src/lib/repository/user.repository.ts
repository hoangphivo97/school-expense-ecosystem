import { CreateUserInput, CreateUserResult, PaginatedUserResult, UpdateUserInput, UserQueryPayload } from '@school-expense-ecosystem/admin/types';
import { UserStatus } from '@school-expense-ecosystem/shared/types';

export abstract class UserRepository {
  abstract findPaginated(filters: UserQueryPayload): Promise<PaginatedUserResult>;
  abstract checkIdentityConflict(email: string, userCode: string): Promise<boolean>;
  abstract createUserRecord(uid: string, userData: CreateUserInput): Promise<CreateUserResult>;
  abstract updateUserFields(uid: string, updateData: UpdateUserInput): Promise<void>;
  abstract createAuthAccount(email: string, fullName: string, password?: string): Promise<string>;
  abstract findById(uid: string): Promise<any | null>;
  abstract updateStatus(uid: string, status: UserStatus, reason?: string): Promise<void>;
  abstract deleteUserRecord(uid: string): Promise<void>;
  abstract deleteAuthAccount(uid: string) : Promise<void>;
}