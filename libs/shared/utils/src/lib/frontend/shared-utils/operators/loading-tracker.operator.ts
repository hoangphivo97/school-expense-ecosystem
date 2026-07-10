import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { defer } from 'rxjs';
import { finalize } from 'rxjs';

/**
 * Custom RxJS operator that binds an asynchronous pipeline's execution lifecycle
 * straight to an Angular WritableSignal infrastructure.
 */
export function trackLoading<T>(loadingSignal: WritableSignal<boolean>) {
  return (source: Observable<T>): Observable<T> => {
    return defer(() => {
      loadingSignal.set(true); // Flip indicator on active subscription stream initiation
      return source.pipe(
        finalize(() => loadingSignal.set(false)) // Guarantees execution on success or failure terminations
      );
    });
  };
}