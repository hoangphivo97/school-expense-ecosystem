// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/roles.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { Role } from '@school-expense-ecosystem/shared/types';

export const rolesGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthSignalStore);
  const router = inject(Router);
  const user = authStore.user();

  if (!user) {
    return router.createUrlTree(['/auth']);
  }

  if (user.role === Role.LEVEL_0_ADMIN) {
    return true;
  }

  const expectedRoles = route.data['roles'] as Role[];
  
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const hasRequiredRole = expectedRoles.includes(user.role);
  if (hasRequiredRole) {
    return true;
  }

  if (state.url !== '/dashboard') {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/auth']);
};