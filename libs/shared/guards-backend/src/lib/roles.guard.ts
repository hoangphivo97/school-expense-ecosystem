import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@school-expense-ecosystem/shared/types';
import { ROLES_KEY } from './decorators/roles.decorator';
import { InsufficientPermissionsException, UserContextNotFoundException } from '@school-expense-ecosystem/shared/utils-backend';

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
      throw new UserContextNotFoundException();
    }


    const hasPermission = requiredRoles.some((role) => user.role === role);

    if (!hasPermission) {
      throw new InsufficientPermissionsException();
    }

    return true;
  }
}