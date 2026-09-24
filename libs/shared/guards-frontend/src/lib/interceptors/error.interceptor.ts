import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import { DialogError, ErrorResponse } from '@school-expense-ecosystem/shared/types';
import { NotificationService } from '@school-expense-ecosystem/shared/ui';

type ErrorModalDelegate = (payload: DialogError) => void;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const showErrorModal = inject(HTTP_ERROR_DELEGATE, { optional: true }) as ErrorModalDelegate | null;

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        // Concurrency conflict (Optimistic locking fail)
        case 409: {
          const errorBody = err.error as Partial<ErrorResponse>;
          const msg = errorBody?.errorMsg || 'Data has been modified by another process. Please reload.';

          if (showErrorModal) {
            showErrorModal({
              statusCode: 409,
              errorCode: errorBody?.errorCode || 'CONCURRENCY_CONFLICT',
              title: 'Data Out of Sync',
              errorMsg: msg,
              hint: 'Please refresh the page to fetch the latest state before retrying.',
            });
          } else {
            notify.error(msg);
          }
          break;
        }

        // Internal Server Error
        case 500: {
          const errorBody = err.error as Partial<ErrorResponse>;
          if (showErrorModal) {
            showErrorModal({
              statusCode: 500,
              errorCode: errorBody?.errorCode || 'INTERNAL_SERVER_ERROR',
              title: 'Server Error',
              errorMsg: errorBody?.errorMsg || 'The server encountered an unexpected condition.',
              hint: 'Please try again later or contact the system administrator.',
            });
          }
          break;
        }

        // Network loss or CORS drop
        case 0: {
          notify.error('Network connection issue. Please check your internet connection.');
          break;
        }
      }

      // Re-throw so individual feature services can still handle specific errors if needed
      return throwError(() => err);
    })
  );
};