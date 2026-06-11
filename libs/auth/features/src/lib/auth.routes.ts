import { Routes } from '@angular/router';
import { authGuard, waitingApprovalGuard } from '@school-expense-ecosystem/auth/data-access';
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
    canActivate: [authGuard],
    component: OnboardingComponent
  },
  {
    path: 'waiting-approval',
    canActivate: [authGuard],
    component: WaitingApprovalComponent
  }
];