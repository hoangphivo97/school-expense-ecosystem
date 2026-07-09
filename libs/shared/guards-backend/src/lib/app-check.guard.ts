import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InvalidAppCheckTokenException, MissingAppCheckTokenException } from './exceptions/guard.exception';
import * as admin from 'firebase-admin';

export const SKIP_APP_CHECK_KEY = 'skipAppCheck';

export const SkipAppCheck = () => SetMetadata(SKIP_APP_CHECK_KEY, true);

@Injectable()
export class AppCheckGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }


  async canActivate(context: ExecutionContext): Promise<boolean> {

    const isSkipAppCheck = this.reflector.getAllAndOverride<boolean>(SKIP_APP_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipAppCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const appCheckToken = request.header('X-Firebase-AppCheck');

    if (!appCheckToken) {
      throw new MissingAppCheckTokenException();
    }

    try {
      await admin.appCheck().verifyToken(appCheckToken);
      return true;
    } catch {
      throw new InvalidAppCheckTokenException();
    }
  }
}