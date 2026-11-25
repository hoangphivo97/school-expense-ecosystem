import { Injectable, inject, Injector, effect } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { catchError, filter, from, map, Observable, of, switchMap, take } from 'rxjs';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { AuthService } from './auth.service';

export type ApprovalWatchOutcome =
  | { status: 'ACTIVATED'; user: UserBase }
  | { status: 'REJECTED'; reason: string }
  | { status: 'FE_SESSION_EXPIRED' };

@Injectable({
  providedIn: 'root'
})
export class AuthRealtimeService {
  private readonly firestore = inject(Firestore);
  private readonly authStore = inject(AuthSignalStore);
  private readonly authService = inject(AuthService);

  watchApprovalOutcome(uid: string): Observable<ApprovalWatchOutcome> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userStream$ = docData(userDocRef) as Observable<UserBase>;

    return userStream$.pipe(
      filter(
        (user): user is UserBase =>
          Boolean(user) &&
          (user.status === UserStatus.ACTIVE || user.status === UserStatus.REJECTED)
      ),
      take(1),
      switchMap((updatedUser) => this.synchronizeSessionOutcome(updatedUser))
    );
  }

  private synchronizeSessionOutcome(updatedUser: UserBase): Observable<ApprovalWatchOutcome> {
    if (updatedUser.status === UserStatus.REJECTED) {
      this.authStore.updateAuthState(null, null);
      return of({
        status: 'REJECTED',
        reason: updatedUser.reason || 'Registration onboarding credentials rejected.',
      });
    }

    return from(this.authService.restoreOrRefreshSession()).pipe(
      map((freshToken): ApprovalWatchOutcome =>
        freshToken
          ? { status: 'ACTIVATED', user: updatedUser }
          : { status: 'FE_SESSION_EXPIRED' }
      ),
      catchError(() => of<ApprovalWatchOutcome>({ status: 'FE_SESSION_EXPIRED' }))
    );
  }
}