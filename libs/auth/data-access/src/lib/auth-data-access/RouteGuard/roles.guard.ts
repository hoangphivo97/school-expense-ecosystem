// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/roles.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthSignalStore } from './auth-signal.store';
import { Role } from '@school-expense-ecosystem/auth/types';

export const rolesGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthSignalStore);
  const router = inject(Router);

  const user = authStore.user();
  if (!user) {
    return router.createUrlTree(['/auth']);
  }

  const expectedRoles = route.data['roles'] as Role[];
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  /**
   * Synchronous validation checking if user properties contain matching role criteria matches
   */
  const hasRequiredRole = expectedRoles.includes(user.role);

  if (hasRequiredRole) {
    return true;
  }

  /**
   * Access denied due to privilege mismatch. Forwarding user back to core workspace dashboard
   */
  return router.createUrlTree(['/dashboard']);
};