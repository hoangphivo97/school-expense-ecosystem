import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { AuthSignalStore } from './auth-signal.store';

export const activeUserGuard: CanActivateFn = () => {
    const authStore = inject(AuthSignalStore);
    const router = inject(Router);
    const user = authStore.user();

    if (!user) return router.createUrlTree(['/auth']);

    switch (user.status) {
        case UserStatus.ACTIVE:
            return true;

        case UserStatus.ONBOARDING:
            return router.createUrlTree(['/auth/onboarding']);

        case UserStatus.PENDING:
            return router.createUrlTree(['/auth/waiting-approval']);

        case UserStatus.REJECTED:
        case UserStatus.SUSPENDED:
            /**
             * Retain the token within storage to maintain UI context upon refresh (F5),
             * but lockdown entry points to application dashboard layout trees.
             */
            return router.createUrlTree(['/auth/rejected']);

        default:
            // Fail-safe default: clear anomalies and bounce back to authentication gate
            authStore.updateAuthState(null);
            return router.createUrlTree(['/auth']);
    }
};