import { Routes } from '@angular/router';
import { activeUserGuard, authGuard, rolesGuard } from '@school-expense-ecosystem/auth/guards-frontend';
import { Role } from '@school-expense-ecosystem/shared/types';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('@school-expense-ecosystem/auth/features').then(m => m.AUTH_ROUTES)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, activeUserGuard],
    canActivateChild: [rolesGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@school-expense-ecosystem/dashboard/features').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'user-list',
        loadComponent: () =>
          import('@school-expense-ecosystem/admin/features').then((m) => m.UserListComponent)
      },
      {
        path: 'expense',
        data: { roles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER] },
        loadChildren: () =>
          import('@school-expense-ecosystem/expenses/features').then(
            (m) => m.EXPENSE_ROUTES_EXPENSE_LIST
          ),
      },
      {
        path: 'report',
        data: { roles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN] },
        loadChildren: () =>
          import('@school-expense-ecosystem/expenses/features').then(
            (m) => m.EXPENSE_ROUTES_REPORT
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('@school-expense-ecosystem/finance/features').then(
            (m) => m.FINANCE_ROUTES
          ),
      },
      {
        path: '**',
        redirectTo: 'project-overview',
      },
    ],
  },
];
