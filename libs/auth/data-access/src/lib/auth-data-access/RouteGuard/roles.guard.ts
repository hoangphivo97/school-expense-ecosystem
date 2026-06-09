import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { Role } from '@school-expense-ecosystem/auth/types';

export const rolesGuard: CanActivateFn = (route, state) => {
  const authQuery = inject(AuthQuery);
  const router = inject(Router);
  
  // Extract the array of allowed roles defined in the route configurations
  const allowedRoles = route.data?.['allowedRoles'] as Role[];

  return authQuery.select('user').pipe(
    take(1),
    map((user) => {
      // 1. Secure check: Ensure the user is authenticated
      if (!user) {
        return router.createUrlTree(['/auth/login']);
      }

      // 2. Authorization check: Validate if the user's role exists within the permitted roles array
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Evict unauthorized users back to the safe default dashboard area
        return router.createUrlTree(['/dashboard']);
      }

      return true; // Authorized user can proceed to the component
    })
  );
};