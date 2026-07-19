import { FacultyId, Role, UserStatus, UserType } from '../enums/user.enum';
import * as React from 'react';

export interface ReactComponentType {
  MuiDarkModeToggle: React.ComponentType<DarkModeToggleProps>;
}

export interface DarkModeToggleProps {
  onThemeChange?: (isDark: boolean) => void;
  isDark?: boolean;
}

export interface BaseFilterParams {
  searchTerm?: string | null;
}

export interface FilterUserParams extends BaseFilterParams {
  role?: Role;
  userType?: UserType;
  status?: UserStatus; // Strongly typed to represent active/inactive user accounts
  facultyId?: FacultyId;
}

export interface UserRequestFilters extends FilterUserParams, PaginationParams { }

export interface PaginationParams {
  limit: number;
  pageToken?: string;
}

export type AuthenticatedUser = Required<
  Pick<UserBase, 'uid' | 'role' | 'userType' | 'fullName' | 'userCode' | 'facultyId'>
>;

export interface UserBase {
  uid: string;
  username?: string;
  fullName?: string;
  role: Role;
  email: string;
  facultyId?: FacultyId;
  userType?: UserType;
  userCode?: string;
  dateOfBirth?: string;
  status: UserStatus;
  createdAt?: Date;
  reason?: string;
}

export interface DemoAccount {
  role: string;
  email: string;
  password: string;
  description: string;
}

export type SharedFilterParams = SharedFilterFields;

export interface SharedFilterFields {
  month?: number | null;
  year?: number | null;
  searchTerm?: string | null;
  status?: string | null;
  facultyId?: string | null;
  userType?: string | null;
  role?: string | null;
}