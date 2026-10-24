import { FacultyId, Role, UserStatus, UserType, FilterUserParams, CursorPaginationParams } from '@school-expense-ecosystem/shared/types';
import { DeleteReasonType } from '../enums/user-list.enum';

/**
 * Unified Flat User Query Payload Contract.
 */
export type UserQueryPayload = FilterUserParams & CursorPaginationParams;

/**
 * Administrative payload for creating a managed directory user
 */
export interface CreateManagedUserPayload {
  email: string;
  role: Role;
  userType?: UserType;
  userCode: string;
  fullName: string;
  password?: string;
  facultyId?: FacultyId | null;
  createdBy?: string;
  dateOfBirth?: string;
}

/**
 * Administrative payload for updating directory user attributes
 */
export interface UpdateManagedUserPayload {
  fullName?: string;
  role?: Role;
  userType?: UserType;
  facultyId?: FacultyId | null;
  dateOfBirth?: string;
}

export interface ChangeManagedUserStatusPayload {
  status: UserStatus;
  reason?: string;
}

export interface DeleteManagedUserPayload {
  reasonType: DeleteReasonType;
  confirmationText?: string;
}

// Backward-compatibility aliases for legacy code referencing old names
export type CreateUserInput = CreateManagedUserPayload;
export type UpdateUserInput = UpdateManagedUserPayload;
export type DeleteUserPayload = DeleteManagedUserPayload;
export type CreateUserPayload = CreateManagedUserPayload;
export type UpdateUserPayload = UpdateManagedUserPayload;
export type ChangeUserStatusPayload = ChangeManagedUserStatusPayload;