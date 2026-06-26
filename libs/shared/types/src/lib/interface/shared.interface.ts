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
  month?: number;
  year?: number;
  role?: Role;
  userType?: UserType;
  status?: UserStatus;
  facultyId?: FacultyId;
}

export interface PaginationParams {
  limit: number;
  pageToken?: string;
}