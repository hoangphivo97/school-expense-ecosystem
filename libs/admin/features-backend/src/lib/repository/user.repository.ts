import { CreateUserInput, CreateUserResult, PaginatedUserResult, UpdateUserInput } from '@school-expense-ecosystem/admin/types';

export abstract class UserRepository {
  abstract findPaginated(filters: {
    facultyId?: string;
    limit: number;
    pageToken?: string;
  }): Promise<PaginatedUserResult>;
  abstract checkIdentityConflict(email: string, userCode: string): Promise<boolean>;
  abstract createUserRecord(uid: string, userData: CreateUserInput): Promise<CreateUserResult>;
  abstract updateUserFields(uid: string, updateData: UpdateUserInput): Promise<void>;
  abstract createAuthAccount(email: string, fullName: string, password?: string): Promise<string>;
  abstract findById(uid: string): Promise<any | null>;
}