// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/roles.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { AuthService } from './auth.service'; // ✅ Import your AuthService or AuthStore to handle logout

export const rolesGuard: CanActivateFn = (route, state) => {
  const authQuery = inject(AuthQuery);
  const authService = inject(AuthService); // ✅ Inject service to clear broken sessions
  const router = inject(Router);
  
  const allowedRoles = route.data?.['allowedRoles'];

  return authQuery.select('user').pipe(
    take(1),
    map((user) => {
      // 1. Standard authentication check
      if (!user) {
        return router.createUrlTree(['/auth']);
      }

      /**
       * If the user session exists but lacks an assigned role, it indicates an unboarded or corrupted account state.
       * We must actively evict the toxic token/session before redirecting to prevent the Auth/Guest rebound loop.
       */
      if (!user.role) {
        console.warn('Security Alert: Authenticated user lacks a valid system role. Evicting session.');
        authService.signOut(); // 🧼 Wipe out localstorage tokens/Akita store state cleanly
        return router.createUrlTree(['/auth']);
      }

      // 2. Standard authorization check
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return router.createUrlTree(['/dashboard']);
      }

      return true;
    })
  );
};