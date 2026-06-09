import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isLoading$.pipe(
    // Wait until the authentication store finishes loading the state from storage
    filter((loading) => !loading),
    take(1),
    map(() => {
      const user = authService.currentUser;
      
      // If user context exists, authorize entry; otherwise deflect to the root auth gateway
      return user ? true : router.createUrlTree(['/auth']);
    })
  );
};
