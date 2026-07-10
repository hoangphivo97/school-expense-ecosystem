import { FilterParams } from '@school-expense-ecosystem/shared/types';

export type MonthFilter = { year: number; month: number };
export type YearFilter = { year: number };

// guards
export function isMonthFilter(p: FilterParams): p is MonthFilter {
  return typeof p.year === 'number' && typeof p.month === 'number';
}
export function isYearFilter(p: FilterParams): p is YearFilter {
  return typeof p.year === 'number' && typeof p.month !== 'number';
}
