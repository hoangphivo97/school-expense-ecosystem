import { SetMetadata } from '@nestjs/common';
import { UserType } from '@school-expense-ecosystem/shared/types';

export const USER_TYPES_KEY = 'user_types';
export const UserTypes = (...types: UserType[]) => SetMetadata(USER_TYPES_KEY, types);