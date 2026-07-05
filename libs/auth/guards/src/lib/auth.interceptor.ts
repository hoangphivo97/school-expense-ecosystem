import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { Router } from '@angular/router';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogError } from '@school-expense-ecosystem/shared/types';

type ErrorModalDelegate = (payload: DialogError) => void;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);
  const snackBar = inject(MatSnackBar)

  const showErrorModal = inject(HTTP_ERROR_DELEGATE, { optional: true }) as ErrorModalDelegate | null;

  const nestJsToken = authStore.token();

  const clonedReq = nestJsToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${nestJsToken}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Centralized error dispatching flow based on HTTP status codes
      switch (err.status) {
        case 500:
          return handle500Error(err, showErrorModal);
        case 403:
          return handle403Error(err, authStore, router, snackBar);
        case 401:
          return handle401Error(err, req, next, auth, router, showErrorModal);
        default:
          return throwError(() => err);
      }
    }),
  );
};

function handle500Error(err: HttpErrorResponse, showErrorModal: ErrorModalDelegate | null): Observable<never> {
  if (showErrorModal) {
    showErrorModal({
      title: 'Server Error',
      errorMsg: 'The server encountered an internal error and was unable to complete your request.',
      hint: 'Please try again later or contact the system administrator.'
    });
  }
  return throwError(() => err);
}

// Error 403
function handle403Error(
  err: HttpErrorResponse, 
  authStore: AuthSignalStore, 
  router: Router, 
  snackBar: MatSnackBar
): Observable<never> {
  const errorBody = err.error;

  // Case 1: Tài khoản bị khóa quyền truy cập hệ thống
  if (errorBody?.code === 'ACCOUNT_RESTRICTED') {
    authStore.updateAuthState(null, null);
    router.navigate(['/auth/rejected'], {
      state: { status: errorBody.status, reason: errorBody.reason }
    });
    return throwError(() => err);
  }

  // Firebase App Check Error
  const isAppCheckFailure =
    err.message?.includes('App Check') ||
    errorBody?.message?.includes('App Check');

  if (isAppCheckFailure) {
    authStore.updateAuthState(null, null);
    router.navigate(['/auth']);
    return throwError(() => err);
  }

  // Demo Account Read-only
  const demoErrorMessage = errorBody?.message || 'Action denied: Demo accounts have read-only access.';
  snackBar.open(demoErrorMessage, 'Close', { 
    duration: 5000,
    panelClass: ['snack-bar-error'] 
  });

  return throwError(() => err);
}

// Error 401 
function handle401Error(
  err: HttpErrorResponse,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  showErrorModal: ErrorModalDelegate | null
): Observable<HttpEvent<unknown>> {
  const isOnboardingRequest = err.url?.includes('/auth/onboarding');
  const isLoginRequest = err.url?.includes('/auth/google-login');

  if (isLoginRequest) {
    return throwError(() => err);
  }

  const attach = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

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