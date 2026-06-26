import { Injectable, inject, Injector, effect } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { Observable } from 'rxjs';
import { UserStatus } from '@school-expense-ecosystem/shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthRealtimeService {
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthSignalStore);

  /**
   * Spawns a clean reactive Signal node bound directly to the Firestore document stream.
   * Eliminates the need for manual subscription ledger management or ngOnDestroy lifecycles.
   * @param uid The unique identity record string of the onboarding user.
   */
  watchStatusAsSignal(uid: string, componentInjector: Injector): void {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userStream$ = docData(userDocRef) as Observable<UserBase>;

    /**
     * Interop Bridge: Transform the data stream into a read-only signal.
     * Passing the local component injector ensures automatic teardown when the view unmounts.
     */
    const liveUserSignal = toSignal(userStream$, { injector: componentInjector });

    effect(() => {
      const updatedUser = liveUserSignal();

      if (!updatedUser) return;

      switch (updatedUser.status) {
        case UserStatus.ACTIVE:
          {
            const currentToken = this.authStore.token();
            this.authStore.updateAuthState(currentToken, updatedUser);
            this.router.navigate(['/dashboard']);
            break;
          }

        case UserStatus.REJECTED:
          this.authStore.updateAuthState(null, null);
          this.router.navigate(['/auth/rejected'], {
            state: {
              status: UserStatus.REJECTED,
              reason: updatedUser.reason || 'Registration onboarding credentials rejected.'
            }
          });
          break;
        default:
          break;
      }
    }, { injector: componentInjector }); // Bind the side-effect layer to the component execution lifespan
  }
}