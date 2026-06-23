import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faFileCircleXmark, faRightFromBracket, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

interface RestrictionNavigationState {
  status?: UserStatus;
  reason?: string;
}

@Component({
  selector: 'lib-rejected',
  imports: [FontAwesomeModule],
  templateUrl: './rejected.component.html',
  styleUrl: './rejected.component.scss',
  standalone: true
})
export class RejectedComponent {
  private readonly router = inject(Router);

  // Expose icon
  protected readonly faUserSlash = faUserSlash;
  protected readonly faFileCircleXmark = faFileCircleXmark;
  protected readonly faEnvelope = faEnvelope;
  protected readonly faRightFromBracket = faRightFromBracket;

  protected readonly restrictionData = computed<RestrictionNavigationState>(() => {
    const activeNav = this.router.currentNavigation()?.extras.state as RestrictionNavigationState;
    const persistentState = history.state as RestrictionNavigationState;

    return {
      status: activeNav?.status || persistentState?.status,
      reason: activeNav?.reason || persistentState?.reason
    };
  });

  readonly userStatuEnum = UserStatus

  navigateToLogin(): void {
    this.router.navigate(['/auth']);
  }
}
