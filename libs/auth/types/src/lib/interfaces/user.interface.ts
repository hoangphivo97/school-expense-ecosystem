import { ConflictReason } from '../enums/auth.enum';
import { UserType, FacultyId, UserBase } from '@school-expense-ecosystem/shared/types';
export interface LoginResponse {
  token: string;
  user: UserBase;
}

export interface OnboardingResponse {
  message: string;
  token: string;
  user: UserBase;
}

export interface OnboardingData {
  fullName: string;
  userCode: string;
  dateOfBirth: string;
  facultyId: FacultyId;
  userType: UserType;
}

export interface IAuthIdentityCheck {
  uid: string;
  email: string;
  userCode: string;
}

export interface IConflictResolution {
  isConflict: boolean;
  reason?: ConflictReason;
  shouldLinkPreCreatedAccount: boolean;
}