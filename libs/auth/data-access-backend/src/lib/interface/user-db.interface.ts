import { UserBase } from '@school-expense-ecosystem/auth/types';

export interface UserInDb extends UserBase {
  password?: string; 
}