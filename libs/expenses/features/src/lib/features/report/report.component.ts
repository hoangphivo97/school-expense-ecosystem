import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HeaderComponent, FilterComponent } from '@school-expense-ecosystem/shared/ui';
import { MatIcon } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  makeMonthlyColumnChart,
  makeLineChart,
  makePieChart,
} from '../report/utils/multiple-charts-helper';
import { calcChangePct, calcKPIs, getPrevMonth, parseRouterFilterParams, ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import {
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { ExpenseList } from '@school-expense-ecosystem/expenses/types';
import {
  FilterParams,
} from '@school-expense-ecosystem/shared/types';
import { CommonModule, DecimalPipe } from '@angular/common';
import { mainColorPieChart } from '@school-expense-ecosystem/shared/constants';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'lib-report',
  standalone: true,
  imports: [
    HeaderComponent,
    FilterComponent,
    MatIcon,
    NgApexchartsModule,
    DecimalPipe,
    CommonModule,
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);

  readonly availableYears = signal<number[]>([]);

  readonly refreshTrigger = signal<number>(0);

  private readonly queryParamsSignal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams),
      startWith(this.router.parseUrl(this.router.url).queryParams) // Extracts parameters instantly on load
    )
  );

  readonly filterParams = computed<FilterParams>(() =>
    parseRouterFilterParams(this.queryParamsSignal())
  );

  readonly monthExpenses = toSignal(
    toObservable(computed(() => ({ f: this.filterParams(), refresh: this.refreshTrigger() }))).pipe(
      switchMap(({ f }) => this.expenseService.getExpenseList({ year: f.year, month: f.month }))
    ),
    { initialValue: [] as ExpenseList[] }
  );

  readonly prevMonthExpenses = toSignal(
    toObservable(computed(() => ({ f: this.filterParams(), refresh: this.refreshTrigger() }))).pipe(
      switchMap(({ f }) => this.expenseService.getExpenseList(getPrevMonth(f)))
    ),
    { initialValue: [] as ExpenseList[] }
  );

  readonly yearExpenses = toSignal(
    toObservable(computed(() => ({ f: this.filterParams(), refresh: this.refreshTrigger() }))).pipe(
      switchMap(({ f }) => this.expenseService.getExpenseList({ year: f.year }))
    ),
    { initialValue: [] as ExpenseList[] }
  );

  readonly kpis = computed(() => {
    const curr = this.monthExpenses();
    const prev = this.prevMonthExpenses();
    const kNow = calcKPIs(curr);
    const kPrev = calcKPIs(prev);
    return { ...kNow, changePct: calcChangePct(kNow.total, kPrev.total) };
  });

  readonly lineOpts = computed(() => makeLineChart(this.monthExpenses()));

  readonly pieOpts = computed(() =>
    makePieChart(this.monthExpenses(), {
      title: 'Expense By Category',
      colors: mainColorPieChart,
    })
  );

  readonly barOpts = computed(() => {
    const year = this.filterParams().year ?? new Date().getFullYear();
    return makeMonthlyColumnChart(this.yearExpenses(), year, {
      title: 'Monthly Expenses',
      seriesName: 'Expenses',
    });
  });

  ngOnInit() {
    this.getCurrYear();
  }

  onFilterChanged(params: FilterParams): void {
    this.router.navigate([], {
      queryParams: { year: params.year, month: params.month },
      queryParamsHandling: 'merge',
    });
  }

  private getCurrYear() {
    this.expenseService.getAllYearsWithDate()
      .subscribe({
        next: (years) => this.availableYears.set(years),
        error: (err) => console.error('Error fetching years:', err),
      });
  }
}
