// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/onboarding.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { AuthSignalStore } from './auth-signal.store';
import { isPlatformServer } from '@angular/common';

export const onboardingGuard: CanActivateFn = (route, state) => {
    const authStore = inject(AuthSignalStore);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (isPlatformServer(platformId)) {
        return true;
    }

    const user = authStore.user();

    if (!user) {
        return router.createUrlTree(['/auth']);
    }

    /**
     * Confirm the user profile context requires onboarding form completion setup
     */
    if (user.status === UserStatus.ONBOARDING) {
        return true;
    }

    if (user.status === UserStatus.PENDING) {
        return router.createUrlTree(['/auth/waiting-approval']);
    }

    if (user.status === UserStatus.ACTIVE) {
        return router.createUrlTree(['/dashboard']);
    }

    return router.createUrlTree(['/auth']);
};