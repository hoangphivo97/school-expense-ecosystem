import { FacultyId } from '../enums/faculty.enum';
import { Role } from '../enums/role.enum';
import { UserType } from '../enums/user-type.enum';

export interface LoginResponse {
  token: string;
}

export interface UserBase {
  uid: string;
  username: string;
  role: Role;         
  email: string;
  facultyId?: FacultyId;  
  userType?: UserType;
  createdAt?: string;
}

// Interface for store localStorage/Session
export interface UserSession extends UserBase {
  token: string; 
}