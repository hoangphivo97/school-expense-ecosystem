import { Injectable, CanActivate, ExecutionContext, ForbiddenException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DemoAccountArr } from '@school-expense-ecosystem/shared/constants';
import { IS_PUBLIC_KEY } from '@school-expense-ecosystem/shared/guards-backend';
import { ErrorResponse, UserBase } from '@school-expense-ecosystem/shared/types';
import { Request } from 'express';

@Injectable()
export class DemoSandboxGuard implements CanActivate {
  constructor( private reflector: Reflector){}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract the authenticated user attached by JwtAuthGuard previously
    const user = request.user as UserBase; 

    // HTTP methods that mutate data inside the production database
    const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    // Hardcoded demo account allocated exclusively for the evaluation committee
    const demoEmails = new Set(DemoAccountArr.map(account => account.email));

    const isDemoUser = demoEmails.has(user.email);
    const isWriteMethod = writeMethods.includes(request.method);

    // Intercept and block mutative state transformations executed by the demo user
    if (isDemoUser && isWriteMethod) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: 'AUTH_DEMO_READ_ONLY',
        errorMsg: 'Demo Mode: Data mutation is disabled in this evaluation sandbox to preserve live database integrity.',
      } as ErrorResponse);
    }

    // Allow the request to proceed if it is a safe method (GET) or a non-demo user
    return true;
  }
}