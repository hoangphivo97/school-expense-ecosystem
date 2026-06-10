import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

export const unauthGuard: CanActivateFn = (route, state) => {
  const authQuery = inject(AuthQuery);
  const router = inject(Router);

  return authQuery.select('user').pipe(
    take(1),
    map((user) => {
      if (!user) {
        return true;
      }

      if (user.status === UserStatus.ONBOARDING) {
        if (state.url === '/auth/onboarding') return true;
        return router.createUrlTree(['/auth/onboarding']);
      }

      if (user.status === UserStatus.PENDING) {
        if (state.url === '/auth/waiting-approval') return true; 
        return router.createUrlTree(['/auth/waiting-approval']);
      }

      if (user.status === UserStatus.ACTIVE) {
        return router.createUrlTree(['/dashboard']);
      }

      return true;
    })
  );
};