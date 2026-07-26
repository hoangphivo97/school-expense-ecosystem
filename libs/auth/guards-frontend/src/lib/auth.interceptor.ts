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
import { DialogError, ErrorResponse, RestrictedAccountError } from '@school-expense-ecosystem/shared/types';

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
  const isGitHubRequest = req.url.startsWith('https://api.github.com');

  const clonedReq = nestJsToken && !isGitHubRequest
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
  const errorBody = err.error as Partial<ErrorResponse>;

  if (showErrorModal) {
    showErrorModal({
      statusCode: 500,
      errorCode: errorBody?.errorCode || 'INTERNAL_SERVER_ERROR',
      errorMsg: errorBody?.errorMsg || 'The server encountered an internal error and was unable to complete your request.',
      title: 'Server Error',
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
  const errorBody = err.error as ErrorResponse;

  switch (errorBody.errorCode) {
    // Case 1: USER ACCOUNT SUSPENDED
    case 'AUTH_ACCOUNT_RESTRICTED': {
      const restrictedError = errorBody as RestrictedAccountError;
      authStore.updateAuthState(null, null);
      router.navigate(['/auth/rejected'], {
        state: { status: restrictedError.userStatus, reason: restrictedError.reason }
      });
      break;
    }

    case 'AUTH_DEMO_READ_ONLY': {
      snackBar.open(errorBody.errorMsg, 'Close', {
        duration: 6000,
        panelClass: ['toast-warning']
      });
      break;
    }

    // Case 2: APP CHECK FAIL
    case 'AUTH_MISSING_APP_CHECK_TOKEN':
    case 'AUTH_INVALID_APP_CHECK_TOKEN': {
      authStore.updateAuthState(null, null);
      router.navigate(['/auth']);
      break;
    }

    // Case 3: DEMO ACCOUNT
    default: {
      const fallbackMessage = errorBody?.errorMsg || 'Action denied: Insufficient permissions.';
      snackBar.open(fallbackMessage, 'Close', {
        duration: 5000,
        panelClass: ['toast-error']
      });
      break;
    }
  }

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
        const basePayload = {
          statusCode: 401,
          errorCode: 'FE_SESSION_EXPIRED',
        };

        if (isOnboardingRequest) {
          showErrorModal({
            ...basePayload,
            title: 'Account Setup Failed',
            errorMsg: 'We could not verify your temporary onboarding session.',
            hint: 'Please try signing in with Google again to restart your registration.'
          });
        } else {
          showErrorModal({
            ...basePayload,
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