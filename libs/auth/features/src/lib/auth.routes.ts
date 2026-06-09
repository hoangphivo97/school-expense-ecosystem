import { Routes } from '@angular/router';
import { authGuard } from '@school-expense-ecosystem/auth/data-access';
import { LoginComponent } from './features/login/login.component';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { WaitingApprovalComponent } from './features/waiting-approval/waiting-approval';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: LoginComponent // Points directly to /auth
  },
  {
    path: 'onboarding',
    canActivate: [authGuard], // 🛡️ Security Check: Requires valid session token, but bypasses onboardingGuard to prevent loops
    component: OnboardingComponent // Points directly to /auth/onboarding
  },
  {
    path: 'waiting-approval',
    canActivate: [authGuard], // 🛡️ Security Check: Requires valid session token, but bypasses onboardingGuard to prevent loops
    component: WaitingApprovalComponent // Points directly to /auth/waiting-approval
  }
];