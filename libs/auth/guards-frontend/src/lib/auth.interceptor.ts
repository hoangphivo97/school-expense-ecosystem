import { inject } from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  from,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import {
  DialogError,
  ErrorResponse,
  RestrictedAccountError,
} from '@school-expense-ecosystem/shared/types';
import { NotificationService } from '@school-expense-ecosystem/shared/utils-frontend';

type ErrorModalDelegate = (payload: DialogError) => void;

type RefreshTokenState =
  | { status: 'idle' }
  | { status: 'refreshing' }
  | { status: 'success'; token: string }
  | { status: 'failed'; error: unknown };

let isRefreshing = false;
const refreshTokenState$ = new BehaviorSubject<RefreshTokenState>({ status: 'idle' });

const IS_RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);
  const notify = inject(NotificationService);

  const showErrorModal = inject(HTTP_ERROR_DELEGATE, {
    optional: true,
  }) as ErrorModalDelegate | null;

  const nestJsToken = authStore.token();
  const isGitHubRequest = (() => {
    try {
      const parsedUrl = new URL(req.url, window.location.origin);
      return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'api.github.com';
    } catch {
      return false;
    }
  })();

  const clonedReq =
    nestJsToken && !isGitHubRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${nestJsToken}` } })
      : req;

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 403:
          return handle403Error(err, authStore, router, notify);
        case 401:
          return handle401Error(err, req, next, auth, router, authStore, notify, showErrorModal);
        default:
          return throwError(() => err);
      }
    })
  );
};

function handle403Error(
  err: HttpErrorResponse,
  authStore: AuthSignalStore,
  router: Router,
  notify: NotificationService
): Observable<never> {
  const errorBody = err.error as ErrorResponse | undefined;

  switch (errorBody?.errorCode) {
    case 'AUTH_ACCOUNT_RESTRICTED': {
      const restrictedError = errorBody as RestrictedAccountError;
      authStore.updateAuthState(null, null);
      router.navigate(['/auth/rejected'], {
        state: { status: restrictedError.userStatus, reason: restrictedError.reason },
      });
      break;
    }

    case 'AUTH_DEMO_READ_ONLY': {
      notify.warning(errorBody.errorMsg);
      break;
    }

    case 'AUTH_MISSING_APP_CHECK_TOKEN':
    case 'AUTH_INVALID_APP_CHECK_TOKEN': {
      authStore.updateAuthState(null, null);
      router.navigate(['/auth']);
      break;
    }

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

function handle401Error(
  err: HttpErrorResponse,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  authStore: AuthSignalStore,
  notify: NotificationService,
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

  const retryWithToken = (token: string): Observable<HttpEvent<unknown>> =>
    next(attach(token)).pipe(
      catchError((retryErr: HttpErrorResponse) => {
        if (retryErr.status === 403) {
          return handle403Error(retryErr, authStore, router, notify);
        }
        if (retryErr.status === 401) {
          return handleSessionExpired(
            retryErr,
            isOnboardingRequest,
            auth,
            router,
            showErrorModal
          );
        }
        return throwError(() => retryErr);
      })
    );

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
        return retryWithToken(state.token);
      })
    );
  }

  isRefreshing = true;
  refreshTokenState$.next({ status: 'refreshing' });

  return from(auth.restoreOrRefreshSession()).pipe(
    catchError((refreshErr) => {
      isRefreshing = false;
      refreshTokenState$.next({ status: 'failed', error: refreshErr });
      return handleSessionExpired(
        refreshErr,
        isOnboardingRequest,
        auth,
        router,
        showErrorModal
      );
    }),
    switchMap((newNestToken) => {
      isRefreshing = false;
      if (!newNestToken) {
        refreshTokenState$.next({ status: 'failed', error: err });
        return handleSessionExpired(err, isOnboardingRequest, auth, router, showErrorModal);
      }
      refreshTokenState$.next({ status: 'success', token: newNestToken });
      return retryWithToken(newNestToken);
    })
  );
}