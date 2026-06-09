import { Routes } from '@angular/router';
import { rolesGuard } from '@school-expense-ecosystem/auth/data-access';
import { Role } from '@school-expense-ecosystem/auth/types';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'expense',
        canActivate: [rolesGuard],
        data: {
          allowedRoles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER]
        },
        loadComponent: () =>
          import('./features/expense-list/expense-list.component').then(
            (m) => m.ExpenseListComponent
          ),
      },
      {
        path: 'report',
        canActivate: [rolesGuard],
        data: {
          allowedRoles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN]
        },
        loadComponent: () =>
          import('./features/report/report.component').then((m) => m.ReportComponent),
      },
    ]
  }
];