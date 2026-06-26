import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
      throw new HttpException(
        'Hold up, what sketchy bot is trying to crash the party? Missing App Check Token!',
        HttpStatus.FORBIDDEN
      );
    }

    try {
      await admin.appCheck().verifyToken(appCheckToken);
      return true;
    } catch (err) {
      throw new HttpException(
        'That token is either a fake or ancient history! Access denied!',
        HttpStatus.FORBIDDEN
      );
    }
  }
}