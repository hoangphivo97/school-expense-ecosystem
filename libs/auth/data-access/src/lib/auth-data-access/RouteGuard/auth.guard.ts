import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { AuthSignalStore } from './auth-signal.store';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

  if (authStore.user()) {
    return true; 
  }

  // Target route redirection to login interface if token resolution evaluates to void
  return router.createUrlTree(['/auth']); 
};
