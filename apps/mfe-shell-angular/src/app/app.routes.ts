import { Routes } from '@angular/router';
import { authGuard, onboardingGuard, rolesGuard } from '@school-expense-ecosystem/auth/data-access';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { Role } from '@school-expense-ecosystem/auth/types';

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
        canActivate: [rolesGuard],
        loadComponent: () =>
          import('@school-expense-ecosystem/dashboard/features').then((m) => m.DashboardComponent),
      },
      {
        path: 'expense',
        canActivate: [rolesGuard],
        data: { roles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER] },
        loadChildren: () =>
          import('@school-expense-ecosystem/expenses/features').then(
            (m) => m.EXPENSE_ROUTES_EXPENSE_LIST
          ),
      },
      {
        path: 'report',
        canActivate: [rolesGuard],
        data: { roles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN] },
        loadChildren: () =>
          import('@school-expense-ecosystem/expenses/features').then(
            (m) => m.EXPENSE_ROUTES_REPORT
          ),
      },
      {
        path: 'budget-manager',
        canActivate: [rolesGuard],
        data: {
          allowedRoles: [Role.LEVEL_1_FINANCE]
        },
        loadChildren: () =>
          import('@school-expense-ecosystem/finance/features').then(
            (m) => m.FINANCE_ROUTES_BUDGET_MANAGER
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
