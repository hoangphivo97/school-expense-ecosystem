import { FilterExpenseParams } from "@school-expense-ecosystem/expenses/types";


export type MonthFilter = { year: number; month: number };
export type YearFilter = { year: number };

// guards
export function isMonthFilter(p: FilterExpenseParams): p is MonthFilter {
  return typeof p.year === 'number' && typeof p.month === 'number';
}
export function isYearFilter(p: FilterExpenseParams): p is YearFilter {
  return typeof p.year === 'number' && typeof p.month !== 'number';
}
