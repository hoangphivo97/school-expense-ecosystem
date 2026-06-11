// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/roles.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthSignalStore } from './auth-signal.store';
import { isPlatformServer } from '@angular/common';
import { Role } from '@school-expense-ecosystem/auth/types';

export const rolesGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthSignalStore);
  const authService = inject(AuthService); // ✅ Inject service to clear broken sessions
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

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