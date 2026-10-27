import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { AccountRestrictedException, InvalidCredentialsException } from '@school-expense-ecosystem/shared/utils-backend';
import { ALLOWED_STATUSES_KEY } from './decorators/allow-statuses.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const allowedStatuses = this.reflector.getAllAndOverride<UserStatus[]>(ALLOWED_STATUSES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (err || !user) {
      throw err || new InvalidCredentialsException();
    }

    /**
     * Authorization Control Boundary: Intercepts authenticated user contexts
     * to enforce system restriction policies safely outside Passport boundary.
     */
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.REJECTED) {
      throw new AccountRestrictedException(user.status, user.reason);
    }

    if (allowedStatuses && allowedStatuses.includes(user.status)) {
      return user;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        `Access Denied: Account status is '${user.status}'. Please complete onboarding or wait for admin approval.`
      );
    }

    return user;
  }
}