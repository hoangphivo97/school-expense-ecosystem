import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
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
  private readonly authService = inject(AuthService)

  constructor() {}

  handleLogout(): void {
    this.authService.signOut();
  }
}