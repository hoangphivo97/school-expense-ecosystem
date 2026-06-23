import { Routes } from '@angular/router';
import { authGuard, onboardingGuard, unauthGuard, waitingApprovalGuard } from '@school-expense-ecosystem/auth/data-access';
import { LoginComponent } from './features/login/login.component';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { WaitingApprovalComponent } from './features/waiting-approval/waiting-approval.component';
import { RejectedComponent } from './features/rejected/rejected.component';

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
  },
  {
    path: 'rejected',
    component: RejectedComponent
  }
];