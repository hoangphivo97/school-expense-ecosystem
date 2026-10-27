import { SetMetadata } from '@nestjs/common';
import { UserStatus } from '@school-expense-ecosystem/shared/types';

export const ALLOWED_STATUSES_KEY = 'allowedStatuses';
export const AllowStatuses = (...statuses: UserStatus[]) => 
  SetMetadata(ALLOWED_STATUSES_KEY, statuses);