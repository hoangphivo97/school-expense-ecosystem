import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthQuery } from './Akita/auth.query';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';

export const onboardingGuard: CanActivateFn = (route, state) => {
    const authQuery = inject(AuthQuery);
    const router = inject(Router);

    //Listen precisely to the decoupled 'user' slice from the Store
    return authQuery.select().pipe(
        take(1),
        map((authState) => {
            const user = authState.user;

            // 1. Not authenticated -> Redirect to the login page
            if (!user) {
                return router.createUrlTree(['/auth/login']);
            }

            // 2. Restrict Level 3 users if their Faculty or UserType profile is incomplete
            const isLevel3User = user.role === Role.LEVEL_3_USER;
            const isProfileIncomplete = !user.facultyId || !user.userType;

            if (isLevel3User && isProfileIncomplete) {
                if (state.url !== '/auth/onboarding') {
                    return router.createUrlTree(['/auth/onboarding']);
                }
                return true; // Allow staying on the onboarding page to complete the form
            }

            // 3. Redirect to the Waiting Room if the account status is still PENDING approval
            if (user.status === UserStatus.PENDING) {
                if (state.url !== '/auth/waiting-approval') {
                    return router.createUrlTree(['/auth/waiting-approval']);
                }
                return true; // Allow staying on the waiting approval page
            }

            // 4. If the account is already ACTIVE but tries to visit restricted onboarding pages -> Redirect to the main Dashboard
            const isAccessingRestrictedAuthPages =
                state.url === '/auth/onboarding' || state.url === '/auth/waiting-approval';

            if (user.status === UserStatus.ACTIVE && isAccessingRestrictedAuthPages) {
                return router.createUrlTree(['/dashboard']);
            }

            return true; // Fully authorized and ACTIVE user can proceed to the dashboard
        })
    );
};