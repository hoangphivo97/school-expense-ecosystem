import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'lib-waiting-approval',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatButton
  ],
  templateUrl: './waiting-approval.html',
  styleUrl: './waiting-approval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingApprovalComponent {
  private readonly authStore = inject(AuthSignalStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService)

  /**
   * Continuous reactive stream track converted into a modern Angular Signal
   */
  readonly user = this.authStore.user;

  constructor() {
    /**
     * Declarative reactive effect watching for real-time status shifts 
     * delegated by administrative actions
     */
    effect(() => {
      const currentStatus = this.user()?.status;

      if (currentStatus === UserStatus.ACTIVE) {
        Promise.resolve().then(() => {
          this.router.navigate(['/dashboard']);
        });
      } else if (currentStatus === UserStatus.REJECTED) {
        Promise.resolve().then(() => {
          this.router.navigate(['/auth/rejected']);
        });
      }
    });
  }

  handleLogout(): void {
    this.authService.signOut();
  }
}