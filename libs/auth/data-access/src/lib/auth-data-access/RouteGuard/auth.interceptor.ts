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
import { AuthQuery } from './Akita/auth.query';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errorModalService = inject(ErrorModalService);
  const authQuery = inject(AuthQuery);

  const nestJsToken = authQuery.getValue().token;

  const clonedReq = nestJsToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${nestJsToken}` } })
    : req;

  const attach = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {

      // (500 - Internal Server Error)
      if (err.status === 500) {
        try {
          errorModalService.openCustomErrorModal({
            title: 'Server Error',
            errorMsg: 'The server encountered an internal error and was unable to complete your request.',
            hint: 'Please try again later or contact the system administrator.'
          });
        } catch (modalError) {
          console.error('Failed to open ErrorModal from Interceptor:', modalError);
        }
        return throwError(() => err);
      }

      // (401 / 403)
      if (err.status === 401 || err.status === 403) {
        const isOnboardingRequest = err.url?.includes('/auth/onboarding');

        // Thử thách làm mới token bằng cơ chế của Firebase
        return from(Promise.resolve(auth.getFirebaseToken(true))).pipe(
          switchMap((newToken) => next(attach(newToken))),
          catchError(async (err2) => {
            // Nếu cơ chế làm mới thất bại hoàn toàn -> Ép đăng xuất công khai
            await auth.signOut();

            try {
              if (isOnboardingRequest) {
                errorModalService.openCustomErrorModal({
                  title: 'Account Setup Failed',
                  errorMsg: 'We could not verify your temporary onboarding session.',
                  hint: 'Please try signing in with Google again to restart your registration.'
                });
              } else {
                errorModalService.openCustomErrorModal({
                  title: 'Session Expired',
                  errorMsg: 'Your active authorization session has expired or become invalid.',
                  hint: 'Please log back into your account to securely resume your work.'
                });
              }
            } catch (e) {
              console.error('Failed to open ErrorModal for session timeout:', e);
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