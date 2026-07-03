import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAdminExecutor } from '@school-expense-ecosystem/admin/types';

export const ActiveAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IAdminExecutor => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return {
      uid: user?.uid ?? '',
      email: user?.email ?? '',
    };
  },
);