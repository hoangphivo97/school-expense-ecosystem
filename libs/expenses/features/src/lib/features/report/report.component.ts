// libs/expenses/features/src/lib/features/report/report.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgApexchartsModule } from 'ng-apexcharts';
import { filter, map, startWith, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

import { HeaderComponent, FooterComponent, FilterComponent } from '@school-expense-ecosystem/shared/ui';
import { FilterParams } from '@school-expense-ecosystem/shared/types';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { ExpenseAnalyticsDto } from '@school-expense-ecosystem/expenses/types';
import { makeLineChart, makeMonthlyColumnChart, makePieChart } from './utils/multiple-charts-helper';

@Component({
  selector: 'lib-report',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    HeaderComponent,
    FooterComponent,
    FilterComponent,
    MatIcon
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent {
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);

  private readonly refreshTrigger = signal<number>(0);

  private readonly queryParamsSignal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams),
      startWith(this.router.parseUrl(this.router.url).queryParams)
    )
  );



  // Monitors reactive parameter changes derived cleanly from standard history routing states
  readonly filterParams = computed<FilterParams>(() => {
    return this.queryParamsSignal() as unknown as FilterParams;
  });

  // 🌟 ENTERPRISE STREAM: Decoupled analytical data network mapping isolates presentation states neatly
  private readonly analyticsResponse$ = toObservable(
    computed(() => ({ filter: this.filterParams(), refresh: this.refreshTrigger() }))
  ).pipe(
    switchMap(({ filter }) =>
      this.expenseService.getAnalytics({ year: filter.year?.toString(), month: filter.month?.toString() }).pipe(
        catchError((err) => {
          console.error('Unified store analytics endpoint query execution failed:', err);
          return of({ kpis: { total: 0, count: 0, max: 0, changePct: null }, pieData: [], lineData: [], barData: [] } as ExpenseAnalyticsDto);
        })
      )
    )
  );

  readonly analyticsSignal = toSignal(this.analyticsResponse$, {
    initialValue: { kpis: { total: 0, count: 0, max: 0, changePct: null }, pieData: [], lineData: [], barData: [] } as ExpenseAnalyticsDto
  });

  // Maps pristine core server calculations straight to the summary banner row layout template
  readonly kpis = computed(() => this.analyticsSignal().kpis);

  // 🌟 EXACT NAMING BINDINGS: Maps clean server metrics directly with ApexCharts visual formatting rules
  readonly lineOpts = computed(() => makeLineChart(this.analyticsSignal().lineData));
  readonly barOpts = computed(() => makeMonthlyColumnChart(this.analyticsSignal().barData));
  readonly pieOpts = computed(() => makePieChart(this.analyticsSignal().pieData));

  readonly availableYears = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => this.expenseService.getAllYearsWithDate()),
      catchError(() => of([new Date().getFullYear()]))
    ),
    { initialValue: [new Date().getFullYear()] }
  );

  // Syncs date filters seamlessly via URL while stripping searchTerm safely during navigation transitions
  onFilterChanged(params: FilterParams): void {
    this.router.navigate([], {
      queryParams: {
        year: params.year,
        month: params.month,
        searchTerm: null // 👈 Explicitly deletes searchTerm when running analytics states
      },
      queryParamsHandling: 'merge',
    });
  }
}