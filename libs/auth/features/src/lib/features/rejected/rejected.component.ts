import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faFileCircleXmark, faRightFromBracket, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

@Component({
  selector: 'lib-rejected',
  imports: [FontAwesomeModule],
  templateUrl: './rejected.component.html',
  styleUrl: './rejected.component.scss',
  standalone: true
})
export class RejectedComponent {
  private readonly authStore = inject(AuthSignalStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Expose icon
  protected readonly faUserSlash = faUserSlash;
  protected readonly faFileCircleXmark = faFileCircleXmark;
  protected readonly faEnvelope = faEnvelope;
  protected readonly faRightFromBracket = faRightFromBracket;

  protected readonly userStatus = this.authStore.user()?.status;
  protected readonly statusReason = this.authStore.user()?.statusReason;

  readonly userStatuEnum = UserStatus

  onLogout(): void {
    this.authService.signOut();

    this.router.navigate(['/auth/login']);
  }
}
