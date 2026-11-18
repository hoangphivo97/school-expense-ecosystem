import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
  HttpContextToken,
} from '@angular/common/http';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, from, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import { DialogError, ErrorResponse, RestrictedAccountError } from '@school-expense-ecosystem/shared/types';
import { NotificationService } from '@school-expense-ecosystem/shared/utils-frontend';

type ErrorModalDelegate = (payload: DialogError) => void;

type RefreshTokenState =
  | { status: 'idle' }
  | { status: 'refreshing' }
  | { status: 'success'; token: string }
  | { status: 'failed'; error: unknown };

let isRefreshing = false;
let refreshTokenState$ = new BehaviorSubject<RefreshTokenState>({ status: 'idle' });

const IS_RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);
  const notify = inject(NotificationService);

  const showErrorModal = inject(HTTP_ERROR_DELEGATE, { optional: true }) as ErrorModalDelegate | null;

  const nestJsToken = authStore.token();
  const isGitHubRequest = (() => {
    try {
      const parsedUrl = new URL(req.url, window.location.origin);
      return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'api.github.com';
    } catch {
      return false;
    }
  })();

  const clonedReq = nestJsToken && !isGitHubRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${nestJsToken}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Centralized error dispatching flow based on HTTP status codes
      switch (err.status) {
        case 403:
          return handle403Error(err, authStore, router, notify);
        case 401:
          return handle401Error(err, req, next, auth, router, showErrorModal);
        default:
          return throwError(() => err);
      }
    }),
  );
};

// Error 403
function handle403Error(
  err: HttpErrorResponse,
  authStore: AuthSignalStore,
  router: Router,
  notify: NotificationService
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
      notify.warning(errorBody.errorMsg);
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
      notify.error(fallbackMessage);
      break;
    }
  }

  return throwError(() => err);
}

function handleSessionExpired(
  err: unknown,
  isOnboardingRequest: boolean,
  auth: AuthService,
  router: Router,
  showErrorModal: ErrorModalDelegate | null
): Observable<never> {
  return from(auth.signOut()).pipe(
    switchMap(() => {
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
            hint: 'Please try signing in with Google again to restart your registration.',
          });
        } else {
          showErrorModal({
            ...basePayload,
            title: 'Session Expired',
            errorMsg: 'Your active authorization session has expired or become invalid.',
            hint: 'Please log back into your account to securely resume your work.',
          });
        }
      }

      router.navigate(['/auth']);
      return throwError(() => err);
    })
  );
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
  const isOnboardingRequest = Boolean(err.url?.includes('/auth/onboarding'));
  const isLoginRequest =
    err.url?.includes('/auth/login') || err.url?.includes('/auth/google-login');

  if (isLoginRequest) {
    return throwError(() => err);
  }

  if (req.context.get(IS_RETRY_AFTER_REFRESH)) {
    return handleSessionExpired(err, isOnboardingRequest, auth, router, showErrorModal);
  }

  const attach = (token: string) =>
    req.clone({
      context: req.context.set(IS_RETRY_AFTER_REFRESH, true),
      setHeaders: { Authorization: `Bearer ${token}` },
    });

  if (isRefreshing) {
    return refreshTokenState$.pipe(
      filter(
        (state): state is Extract<RefreshTokenState, { status: 'success' | 'failed' }> =>
          state.status === 'success' || state.status === 'failed'
      ),
      take(1),
      switchMap((state) => {
        if (state.status === 'failed') {
          return throwError(() => state.error);
        }
        return next(attach(state.token));
      })
    );
  }

  isRefreshing = true;
  refreshTokenState$.next({ status: 'refreshing' });

  return from(auth.restoreOrRefreshSession()).pipe(
    switchMap((newNestToken) => {
      isRefreshing = false;
      if (!newNestToken) {
        refreshTokenState$.next({ status: 'failed', error: err });
        return handleSessionExpired(err, isOnboardingRequest, auth, router, showErrorModal);
      }
      refreshTokenState$.next({ status: 'success', token: newNestToken });
      return next(attach(newNestToken));
    }),
    catchError((err2) => {
      isRefreshing = false;
      refreshTokenState$.next({ status: 'failed', error: err2 });
      return handleSessionExpired(err2, isOnboardingRequest, auth, router, showErrorModal);
    })
  );
}