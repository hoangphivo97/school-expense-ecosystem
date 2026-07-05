import { ExecutionContext, ForbiddenException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorResponse, UserStatus } from '@school-expense-ecosystem/shared/types';
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
      throw err || new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        errorMsg: 'Authentication failed: Invalid credentials or the target identity context was not found.',
      } satisfies ErrorResponse );
    }

    /**
     * Authorization Control Boundary: Intercepts authenticated user contexts
     * to enforce system restriction policies safely outside Passport boundary.
     */
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'AUTH_ACCOUNT_RESTRICTED',
        errorMsg: user.statusReason || 'Access denied: This account has been restricted by administrative policy.',
      } satisfies ErrorResponse);
    }

    return user;
  }
}