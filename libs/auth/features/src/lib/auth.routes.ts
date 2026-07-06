import { Routes } from '@angular/router';
import { authGuard } from '@school-expense-ecosystem/auth/guards';
import { LoginComponent } from './features/login/login.component';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { WaitingApprovalComponent } from './features/waiting-approval/waiting-approval.component';
import { RejectedComponent } from './features/rejected/rejected.component';
import { unauthGuard } from './RouteGuard/unauth.guard';
import { onboardingGuard } from './RouteGuard/onboarding.guard';
import { waitingApprovalGuard } from './RouteGuard/waiting-approval.guard';

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