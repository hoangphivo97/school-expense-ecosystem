

export type MonthFilter = { year: number; month: number };
export type YearFilter = { year: number };

export function isMonthFilter(p: { year?: unknown; month?: unknown }): p is MonthFilter {
  return typeof p.year === 'number' && typeof p.month === 'number';
}
export function isYearFilter(p: { year?: unknown; month?: unknown }): p is YearFilter {
  return typeof p.year === 'number' && typeof p.month !== 'number';
}
