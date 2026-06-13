import { FacultyId } from '../enums/faculty.enum';
import { Role } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';
export interface LoginResponse {
  token: string;
  user: UserBase;
}

export interface UserBase {
  uid: string;
  username: string;
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