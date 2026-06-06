import { FilterParams } from '@school-expense-ecosystem/shared/types';
import { ExpenseList } from './interfaces/expense.interface';
import { Params } from '@angular/router';


export function getPrevMonth(p: Partial<FilterParams>): FilterParams {
  const currentMonth = p.month ?? new Date().getMonth() + 1;
  const currentYear = p.year ?? new Date().getFullYear();

  return currentMonth > 1
    ? { year: currentYear, month: currentMonth - 1 }
    : { year: currentYear - 1, month: 12 };
}

export function calcKPIs(list: ExpenseList[]) {
  const count = list.length;
  let total = 0,
    max = 0;
  for (const e of list) {
    const v = Number(e.amount) || 0;
    total += v;
    if (v > max) max = v;
  }
  return { total, count, max };
}

export function calcChangePct(currTotal: number, prevTotal: number) {
  return prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : null;
}


export function parseRouterFilterParams(params: Params | undefined): FilterParams {
  const yearParsed = Number(params?.['year']);
  const monthParsed = Number(params?.['month']);

  return {
    year: params?.['year'] && !isNaN(yearParsed) ? yearParsed : new Date().getFullYear(),
    month: params?.['month'] && !isNaN(monthParsed) ? monthParsed : new Date().getMonth() + 1,
    searchTerm: params?.['searchTerm'] ?? ''
  };
}
