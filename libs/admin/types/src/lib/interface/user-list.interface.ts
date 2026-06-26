import { FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { FilterParams, PaginationParams } from '@school-expense-ecosystem/shared/types';
import { UserBase } from '@school-expense-ecosystem/auth/types'

/**
 * Strictly-typed business filters extracted directly from the global filter matrix.
 * Every field is contextually optional because the Admin can clear filters to view all users.
 */
export type UserFilters = Pick<FilterParams, 'searchTerm' | 'role' | 'status' | 'userType' | 'facultyId'>;

/**
 * Unified Flat User Query Payload Contract.
 * Composes pristine business criteria with strict technical pagination tokens.
 * Completely eliminates loose parameter code smells in the service layer.
 */
export type UserQueryPayload = UserFilters & PaginationParams;

export interface CreateUserInput {
  fullName: string;
  email: string;
  userCode: string;
  role: Role;
  userType?: UserType;
  facultyId?: FacultyId;
  createdBy?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: Role;
  userType?: UserType;
  facultyId?: FacultyId;
}

export interface CreateUserResult {
  id: string;
  success: boolean;
}

export interface PaginatedUserResult {
  users: UserBase[];
  nextPageToken: string | null;
  totalItems: number;
}