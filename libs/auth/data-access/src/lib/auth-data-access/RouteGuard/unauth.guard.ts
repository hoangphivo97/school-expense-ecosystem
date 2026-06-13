import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { AuthSignalStore } from './auth-signal.store';

export const unauthGuard: CanActivateFn = () => {
  const authStore = inject(AuthSignalStore);
  const router = inject(Router);


  const user = authStore.user();

  if (user) {
    if (user.status === UserStatus.ONBOARDING) {
      return router.createUrlTree(['/auth/onboarding']);
    } else if (user.status === UserStatus.PENDING) {
      return router.createUrlTree(['/auth/waiting-approval']);
    } else if (user.status === UserStatus.ACTIVE) {
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};