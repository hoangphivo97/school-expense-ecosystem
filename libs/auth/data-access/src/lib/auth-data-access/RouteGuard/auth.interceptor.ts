import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { FirebaseError } from 'firebase/app';
import { DialogError } from '@school-expense-ecosystem/shared/types';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errorModalService = inject(ErrorModalService);

  const attach = (token: string | null) =>
    token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return from(Promise.resolve(auth.getIdToken())).pipe(
    switchMap((token) => next(attach(token))),
    catchError((err: HttpErrorResponse) => {

      // (500 - Internal Server Error)
      if (err.status === 500) {
        errorModalService.openCustomErrorModal({
          title: 'Server Error',
          errorMsg: 'The server encountered an internal error and was unable to complete your request.',
          hint: 'Please try again later or contact the system administrator.'
        });
        return throwError(() => err);
      }

      // (401 / 403)
      if (err.status === 401 || err.status === 403) {
        return from(Promise.resolve(auth.getIdToken(true))).pipe(
          switchMap((newToken) => next(attach(newToken))),
          catchError(async (err2) => {
            // If refresh token fail -> force user logout
            await auth.signOut();

            errorModalService.openCustomErrorModal({
              title: 'Session Expired',
              errorMsg: 'Your active authorization token has expired or become invalid.',
              hint: 'Please log back into your account to securely resume your session.'
            });

            router.navigate(['/auth/login']);
            throw err2;
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};