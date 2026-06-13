import { UserBase } from '@school-expense-ecosystem/auth/types';

export interface PaginatedUserResult {
  users: UserBase[];
  nextPageToken: string | null;
  totalItems: number;
}

export abstract class UserRepository {
  abstract findPaginated(filters: {
    facultyId?: string;
    limit: number;
    pageToken?: string;
  }): Promise<PaginatedUserResult>;
}