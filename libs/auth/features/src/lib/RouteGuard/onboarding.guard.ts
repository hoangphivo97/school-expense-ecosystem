// libs/auth/data-access/src/lib/auth-data-access/RouteGuard/onboarding.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';

export const onboardingGuard: CanActivateFn = () => {
    const authStore = inject(AuthSignalStore);
    const router = inject(Router);

    const user = authStore.user();

    if (!user) {
        return router.createUrlTree(['/auth']);
    }

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