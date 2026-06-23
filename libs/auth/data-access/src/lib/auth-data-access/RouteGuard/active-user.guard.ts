import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { AuthSignalStore } from './auth-signal.store';

export const activeUserGuard: CanActivateFn = () => {
    const authStore = inject(AuthSignalStore);
    const router = inject(Router);
    const user = authStore.user();

    if (!user) return router.createUrlTree(['/auth']);

    if (user.status === UserStatus.ACTIVE) {
        return true;
    }

    if (user.status === UserStatus.ONBOARDING) {
        return router.createUrlTree(['/auth/onboarding']);
    }

    if (user.status === UserStatus.PENDING) {
        return router.createUrlTree(['/auth/waiting-approval']);
    }

    if (user.status === UserStatus.REJECTED) {
        return router.createUrlTree(['/auth/rejected']);
    }

    if (user.status === UserStatus.SUSPENDED) {
        return router.createUrlTree(['/auth/rejected']);
    }

    return router.createUrlTree(['/auth']);
};