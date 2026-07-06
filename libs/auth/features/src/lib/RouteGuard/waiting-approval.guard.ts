import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { UserStatus } from '@school-expense-ecosystem/shared/types';

export const waitingApprovalGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);

  const user = authStore.user();
  if (!user) {
    return router.createUrlTree(['/auth']);
  }

  /**
   * Enforce route access filtering based strictly on current user status metrics
   */
  if (user.status === UserStatus.PENDING) {
    return true;
  }

  if (user.status === UserStatus.ACTIVE) {
    return router.createUrlTree(['/dashboard']);
  }

  if (user.status === UserStatus.REJECTED) {
    return router.createUrlTree(['/auth/rejected']);
  }

  if (user.status === UserStatus.ONBOARDING) {
    return router.createUrlTree(['/auth/onboarding']);
  }

  return router.createUrlTree(['/auth']);
};