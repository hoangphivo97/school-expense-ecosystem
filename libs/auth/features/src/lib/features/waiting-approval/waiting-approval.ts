import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { MatButton } from '@angular/material/button';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { Router } from '@angular/router';

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
  private readonly router = inject(Router)
  private readonly authService = inject(AuthService)
  private readonly authStore = inject(AuthSignalStore)

  constructor() {

    effect(() => {
      const user = this.authStore.user();
      if (!user) return;

      // Safely schedule the navigation task into a microtask delay block
      Promise.resolve().then(() => {
        if (user.status === UserStatus.ACTIVE) {
          this.router.navigate(['/dashboard']);
        } else if (user.status === UserStatus.REJECTED) {
          this.router.navigate(['/auth/rejected']);
        }
      });
    });
  }

  handleLogout(): void {
    this.authService.signOut();
  }
}