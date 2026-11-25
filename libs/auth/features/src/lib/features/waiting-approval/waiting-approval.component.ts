import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApprovalWatchOutcome, AuthRealtimeService, AuthService } from '@school-expense-ecosystem/auth/data-access';
import { MatButton } from '@angular/material/button';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/shared/types';

@Component({
  selector: 'lib-waiting-approval',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatButton,
    TranslocoModule
  ],
  templateUrl: './waiting-approval.component.html',
  styleUrl: './waiting-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:[
    { provide: TRANSLOCO_SCOPE, useValue: 'auth' }
  ]
})
export class WaitingApprovalComponent {
  private readonly authStore = inject(AuthSignalStore);
  private readonly authService = inject(AuthService);
  private readonly authRealtimeService = inject(AuthRealtimeService);
  private readonly router = inject(Router);

  readonly displayName = computed(() => this.authStore.user()?.fullName || 'Valued Educator');
  readonly displayEmail = computed(() => this.authStore.user()?.email || 'N/A');

  constructor(){
    toObservable(this.authStore.user)
      .pipe(
        map((user) => user?.uid),
        filter((uid): uid is string => Boolean(uid)),
        take(1),
        switchMap((uid) => this.authRealtimeService.watchApprovalOutcome(uid)),
        takeUntilDestroyed()
      )
      .subscribe((outcome) => this.handleApprovalOutcome(outcome));
  }

  handleLogout(): void {
    this.authService.signOut();
  }

  private handleApprovalOutcome(outcome: ApprovalWatchOutcome): void {
    switch (outcome.status) {
      case 'ACTIVATED':
        void this.router.navigate(['/dashboard']);
        break;

      case 'REJECTED':
        void this.router.navigate(['/auth/rejected'], {
          state: {
            status: UserStatus.REJECTED,
            reason: outcome.reason,
          },
        });
        break;

      case 'FE_SESSION_EXPIRED':
        void this.authService.signOut();
        break;
    }
  }
}