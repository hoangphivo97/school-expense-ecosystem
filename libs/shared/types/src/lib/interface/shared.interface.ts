import { FacultyId, Role, UserStatus, UserType } from '../enums/user.enum';
import * as React from 'react';

export interface ReactComponentType {
  MuiDarkModeToggle: React.ComponentType<DarkModeToggleProps>;
}

export interface DarkModeToggleProps {
  onThemeChange?: (isDark: boolean) => void;
  isDark?: boolean;
}

export interface FilterParams {
  searchTerm?: string;
  month?: number | null;
  year?: number | null;
  role?: Role;
  userType?: UserType;
  status?: UserStatus;
  facultyId?: FacultyId;
}

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