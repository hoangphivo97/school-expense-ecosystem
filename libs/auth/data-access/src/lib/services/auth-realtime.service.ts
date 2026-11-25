import { Injectable, inject, Injector, effect } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { Observable } from 'rxjs';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRealtimeService {
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthSignalStore);
  private readonly authService = inject(AuthService);

  /**
   * Spawns a clean reactive Signal node bound directly to the Firestore document stream.
   * Eliminates the need for manual subscription ledger management or ngOnDestroy lifecycles.
   * @param uid The unique identity record string of the onboarding user.
   */
  watchStatusAsSignal(uid: string, componentInjector: Injector): void {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userStream$ = docData(userDocRef) as Observable<UserBase>;
    const liveUserSignal = toSignal(userStream$, { injector: componentInjector });

    /**
     * Interop Bridge: Transform the data stream into a read-only signal.
     * Passing the local component injector ensures automatic teardown when the view unmounts.
     */

    let isTransitioning = false;

    effect(
      () => {
        const updatedUser = liveUserSignal();
        if (!updatedUser || isTransitioning) return;

        if (updatedUser.status === UserStatus.ACTIVE) {
          isTransitioning = true;
          void this.handleAccountActivation();
          return;
        }

        if (updatedUser.status === UserStatus.REJECTED) {
          isTransitioning = true;
          this.handleAccountRejection(updatedUser);
        }
      },
      { injector: componentInjector }
    );
  }

  private async handleAccountActivation(): Promise<void> {
    try {
      // Refreshes Firebase ID token, exchanges it with NestJS, and updates AuthSignalStore
      const freshToken = await this.authService.restoreOrRefreshSession();

      if (freshToken) {
        await this.router.navigate(['/dashboard']);
        return;
      }

      await this.authService.signOut();
    } catch {
      await this.authService.signOut();
    }
  }

  private handleAccountRejection(updatedUser: UserBase): void {
    this.authStore.updateAuthState(null, null);
    void this.router.navigate(['/auth/rejected'], {
      state: {
        status: UserStatus.REJECTED,
        reason: updatedUser.reason || 'Registration onboarding credentials rejected.',
      },
    });
  }
}