import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { isPlatformServer } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authQuery = inject(AuthQuery);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

  return authQuery.user$.pipe(
    take(1),
    map((user) => {
      if (user) {
        return true;
      }
      
      return router.createUrlTree(['/auth']);
    })
  );
};
