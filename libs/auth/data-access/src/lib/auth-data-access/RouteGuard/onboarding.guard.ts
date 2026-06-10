// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/onboarding.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

export const onboardingGuard: CanActivateFn = (route, state) => {
    const authQuery = inject(AuthQuery);
    const router = inject(Router);

    return authQuery.select().pipe(
        take(1),
        map((authState) => {
            const user = authState.user;

            // 1. Unauthenticated boundary check
            if (!user) {
                return router.createUrlTree(['/auth']);
            }

            // 2. Stage: ONBOARDING -> Force redirect to profile collection funnel
            if (user.status === UserStatus.ONBOARDING) {
                if (state.url === '/auth/onboarding') return true;
                return router.createUrlTree(['/auth/onboarding']);
            }

            // 3. Stage: PENDING -> Deflect to waiting approval lobby screen
            if (user.status === UserStatus.PENDING) {
                if (state.url === '/auth/waiting-approval') return true;
                return router.createUrlTree(['/auth/waiting-approval']);
            }

            // 4. Stage: REJECTED -> Will have an page tell the user being rejected and reason
            if (user.status === UserStatus.REJECTED) {
                return router.createUrlTree(['/auth']);
            }

            // 5. Stage: ACTIVE -> Safe zone validation bypass
            const isAccessingRestrictedAuthPages =
                state.url === '/auth/onboarding' || state.url === '/auth/waiting-approval';

            if (user.status === UserStatus.ACTIVE && isAccessingRestrictedAuthPages) {
                return router.createUrlTree(['/dashboard']);
            }

            return true;
        })
    );
};