import { Injectable, CanActivate, ExecutionContext, ForbiddenException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorResponse, Role } from '@school-expense-ecosystem/shared/types';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'AUTH_USER_CONTEXT_NOT_FOUND',
        errorMsg: 'Access denied: Unable to resolve authenticated session context details.',
      } as ErrorResponse);
    }


    const hasPermission = requiredRoles.some((role) => user.role === role);

    if (!hasPermission) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'AUTH_INSUFFICIENT_PERMISSIONS',
        errorMsg: 'Access denied: Your account scope does not possess the required security clearances.',
      } as ErrorResponse);
    }

    return true;
  }
}