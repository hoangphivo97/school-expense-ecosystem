import { CreateUserResult, PaginatedUserResult, UpdateUserInput, UpdateUserResult } from '@school-expense-ecosystem/admin/types';

export abstract class UserRepository {
  abstract findPaginated(filters: {
    facultyId?: string;
    limit: number;
    pageToken?: string;
  }): Promise<PaginatedUserResult>;
  abstract checkIdentityConflict(email: string, userCode: string): Promise<boolean>;
  abstract createUserRecord(uid: string, userData: any): Promise<CreateUserResult>;
  abstract updateUserRecord(uid: string, data: UpdateUserInput): Promise<UpdateUserResult>;
  abstract createAuthAccount(email: string, fullName: string): Promise<string>;
}