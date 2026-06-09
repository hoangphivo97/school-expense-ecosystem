// libs/finance/features/src/lib/finance.routes.ts
import { Routes } from '@angular/router';
import { rolesGuard } from '@school-expense-ecosystem/auth/data-access';
import { Role } from '@school-expense-ecosystem/auth/types';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    children: [
      /**
       * ✅ BUDGET MANAGER WORKSPACE
       * - Authorized: Finance Officers (to allocate/manage funds) and Faculty Deans (to view department caps).
       * - Restricted: Level 3 End-users and Level 0 Technical Administrators are strictly barred.
       */
      {
        path: 'budget-manager',
        canActivate: [rolesGuard],
        data: {
          allowedRoles: [Role.LEVEL_1_FINANCE]
        },
        loadComponent: () =>
          import('./features/budget-manager/budget-manager').then((m) => m.BudgetManager),
      },
    ],
  },
];