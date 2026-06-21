import { Routes } from '@angular/router';
import { ExpenseListComponent } from './features/expense-list/expense-list.component';
import { ReportComponent } from './features/report/report.component';

export const EXPENSE_ROUTES_EXPENSE_LIST: Routes = [
  {
    path: '',
    component: ExpenseListComponent
  }
]

export const EXPENSE_ROUTES_REPORT: Routes = [
  {
    path: '',
    component: ReportComponent

  }
]