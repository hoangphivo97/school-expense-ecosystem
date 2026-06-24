import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthSignalStore } from './auth-signal.store';

import { HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);

  const showErrorModal = inject(HTTP_ERROR_DELEGATE, { optional: true });

  const nestJsToken = authStore.token();

  const clonedReq = nestJsToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${nestJsToken}` } })
    : req;

  const attach = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {

      // (500 - Internal Server Error)
      if (err.status === 500) {
        if (showErrorModal) {
          showErrorModal({
            title: 'Server Error',
            errorMsg: 'The server encountered an internal error and was unable to complete your request.',
            hint: 'Please try again later or contact the system administrator.'
          });
        }
        return throwError(() => err);
      }

      if (err.status === 403) {
        const errorBody = err.error;

        if (errorBody?.message === 'ACCOUNT_RESTRICTED') {
          authStore.updateAuthState(null, null);
          router.navigate(['/auth/rejected'], {
            state: { status: errorBody.status, reason: errorBody.reason }
          });
          return throwError(() => err);
        }

        const isAppCheckFailure =
          err.message?.includes('App Check') ||
          errorBody?.message?.includes('App Check');

        if (isAppCheckFailure) {
          authStore.updateAuthState(null, null);
          router.navigate(['/auth']);
        }

        return throwError(() => err);
      }

      if (err.status === 401) {
        const isOnboardingRequest = err.url?.includes('/auth/onboarding');

        const isLoginRequest = err.url?.includes('/auth/google-login');

        if (isLoginRequest) {
          return throwError(() => err);
        }

        return from(Promise.resolve(auth.getFirebaseToken(true))).pipe(
          switchMap((newToken) => next(attach(newToken))),
          catchError(async (err2) => {
            await auth.signOut();

            if (showErrorModal) {
              if (isOnboardingRequest) {
                showErrorModal({
                  title: 'Account Setup Failed',
                  errorMsg: 'We could not verify your temporary onboarding session.',
                  hint: 'Please try signing in with Google again to restart your registration.'
                });
              } else {
                showErrorModal({
                  title: 'Session Expired',
                  errorMsg: 'Your active authorization session has expired or become invalid.',
                  hint: 'Please log back into your account to securely resume your work.'
                });
              }
            }

            router.navigate(['/auth']);
            throw err2;
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};