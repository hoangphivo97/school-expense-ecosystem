// libs/finance/features/src/lib/finance.routes.ts
import { Routes } from '@angular/router';
import { BudgetManager } from './features/budget-manager/budget-manager';

export const FINANCE_ROUTES_BUDGET_MANAGER: Routes = [
  {
    path: '',
    component: BudgetManager
  },
];