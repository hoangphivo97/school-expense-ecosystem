import { Routes } from '@angular/router';
import { BudgetManager } from './features/budget-manager/budget-manager';
import { Role } from '@school-expense-ecosystem/shared/types';

export const FINANCE_ROUTES: Routes = [
  {
    path: 'budget-manager',
    data: {
      roles: [Role.LEVEL_1_FINANCE]
    },
    component: BudgetManager
  }
];