import { UserBase } from '@school-expense-ecosystem/shared/types'

export interface CreateUserResult {
  id: string;
  success: boolean;
}

/**
 * Paginated directory response structure
 */
export interface PaginatedUserResult {
  users: UserBase[];
  nextPageToken: string | null;
  totalItems: number;
}