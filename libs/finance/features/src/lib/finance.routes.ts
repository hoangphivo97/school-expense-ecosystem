import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: 'budget-manager',
    loadComponent: () =>
      import('./features/budget-manager/budget-manager').then(
        (m) => m.BudgetManager
      ),
  },
];