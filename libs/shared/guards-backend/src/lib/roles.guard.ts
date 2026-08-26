import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@school-expense-ecosystem/shared/types';
import { ROLES_KEY } from './decorators/roles.decorator';
import { USER_TYPES_KEY } from './decorators/user-type.decorator';
import { UserType } from '@school-expense-ecosystem/shared/types';
import { InsufficientPermissionsException, UserContextNotFoundException } from '@school-expense-ecosystem/shared/utils-backend';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredUserTypes = this.reflector.getAllAndOverride<UserType[]>(USER_TYPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredUserTypes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (requiredRoles && !requiredRoles.some((role) => user.role === role)) {
      throw new InsufficientPermissionsException();
    }

    // 2. Enforce Explicit UserType Boundary (e.g. Block STUDENT from TEACHER routes)
    if (requiredUserTypes && user.role === Role.LEVEL_3_USER) {
      if (!user.userType || !requiredUserTypes.includes(user.userType)) {
        throw new InsufficientPermissionsException();
      }
    }

    return true;
  }
}