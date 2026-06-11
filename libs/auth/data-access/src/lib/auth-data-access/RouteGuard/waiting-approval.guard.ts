import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthSignalStore } from './auth-signal.store';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

export const waitingApprovalGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

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