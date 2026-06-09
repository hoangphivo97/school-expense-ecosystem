import { Routes } from '@angular/router';
import { authGuard } from '@school-expense-ecosystem/auth/data-access';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('@school-expense-ecosystem/auth/features').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'expense' },
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
  {
    path: '**',
    redirectTo: '/expense',
  },
];
