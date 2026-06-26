import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);

  if (authStore.user()) {
    return true; 
  }

  // Target route redirection to login interface if token resolution evaluates to void
  return router.createUrlTree(['/auth']); 
};
