import { Routes } from '@angular/router';
import { authGuard, onboardingGuard, unauthGuard, waitingApprovalGuard } from '@school-expense-ecosystem/auth/data-access';
import { LoginComponent } from './features/login/login.component';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { WaitingApprovalComponent } from './features/waiting-approval/waiting-approval';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    canActivate: [unauthGuard],
    component: LoginComponent // Points directly to /auth
  },
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingGuard],
    component: OnboardingComponent
  },
  {
    path: 'waiting-approval',
    canActivate: [authGuard, waitingApprovalGuard],
    component: WaitingApprovalComponent
  }
];