import { UserType, UserStatus, Role, FacultyId } from '../enums/user.enum';

export interface LoginResponse {
  token: string;
  user: UserBase;
}

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

export type AuthenticatedUser = Required<
  Pick<UserBase, 'uid' | 'role' | 'userType' | 'fullName' | 'userCode' | 'facultyId'>
>;