import { Routes } from '@angular/router';
import { authGuard, onboardingGuard } from '@school-expense-ecosystem/auth/data-access';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('@school-expense-ecosystem/auth/features').then(m => m.AUTH_ROUTES)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => 
          import('@school-expense-ecosystem/dashboard/features').then((m) => m.DashboardComponent),
      },
      {
        path: '',
        loadChildren: () =>
          import('@school-expense-ecosystem/expenses/features').then(
            (m) => m.EXPENSES_ROUTES
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('@school-expense-ecosystem/finance/features').then(
            (m) => m.FINANCE_ROUTES
          ),
      }
    ],
  },
  // 404 fallback
  // {
  //   path: '**',
  //   redirectTo: '/expense',
  // },
];
