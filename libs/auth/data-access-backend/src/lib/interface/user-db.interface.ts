import { UserBase } from '@school-expense-ecosystem/shared/types';

export interface UserInDb extends UserBase {
  password?: string; 
}