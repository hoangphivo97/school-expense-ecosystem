import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector){
    super()
  }

  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid credentials or account not found.');
    }

    /**
     * Authorization Control Boundary: Intercepts authenticated user contexts
     * to enforce system restriction policies safely outside Passport boundary.
     */
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({
        message: 'ACCOUNT_RESTRICTED',
        status: user.status,
        reason: user.statusReason || 'Access restricted by administrator policy.'
      });
    }

    return user;
  }
}