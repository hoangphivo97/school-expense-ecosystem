import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatIcon } from '@angular/material/icon';

import { HeaderComponent, FooterComponent, FilterComponent } from '@school-expense-ecosystem/shared/ui';
import { FilterMode, SharedFilterParams } from '@school-expense-ecosystem/shared/types';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { makeLineChart, makeMonthlyColumnChart, makePieChart } from './utils/multiple-charts-helper';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { FilterExpenseParams } from '@school-expense-ecosystem/expenses/types';


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
  private readonly authSignalStore = inject(AuthSignalStore); // 🌟 BỔ SUNG: Khai thác quyền hạn user đăng nhập


  readonly filterModeEnum = FilterMode;

  readonly filterParams = signal<FilterExpenseParams>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  /**
   * 🌟 ANGULAR 22 REVOLUTION: Khai tử toàn bộ RxJS Pipeline thủ công!
   * Tự động tái kích hoạt tín hiệu fetch data đồ thị khi user biến đổi năm/tháng trên UI
   */
  readonly analyticsResource = this.expenseService.getAnalyticsResource(() => {
    const filter = this.filterParams();
    const currentUser = this.authSignalStore.user() as UserBase;

    return {
      year: filter.year ? Number(filter.year) : undefined,
      month: filter.month ? Number(filter.month) : undefined,
      role: currentUser.role,            // Chuyển giao enum phân quyền chuẩn xác
      facultyId: currentUser.facultyId   // Chuyển giao mã khoa quản lý dòng tiền
    };
  });

  // 🌟 KHAI TỬ REFRESH TRIGGER: Theo dõi biến cờ Loading từ lỗi lõi của Resource
  readonly isLoading = this.analyticsResource.isLoading;

  // Trích xuất KPI sạch sẽ ra ngoài banner tóm tắt tổng quan tiền tệ
  readonly kpis = computed(() => {
    return this.analyticsResource.value()?.kpis ?? { total: 0, count: 0, max: 0, changePct: null };
  });

  // 🎯 MAP CHART OPTIONS: Đưa dữ liệu thô từ Resource vào các helper ApexCharts chuẩn tên trường
  readonly lineOpts = computed(() => makeLineChart(this.analyticsResource.value()?.lineData ?? []));
  readonly barOpts = computed(() => makeMonthlyColumnChart(this.analyticsResource.value()?.barData ?? []));
  readonly pieOpts = computed(() => makePieChart(this.analyticsResource.value()?.pieData ?? []));

  // 🌟 RESOURCE ĐỒNG BỘ: Chuyển đổi nốt danh mục năm có dữ liệu sang Resource tuần hoàn
  readonly availableYearsResource = this.expenseService.getAllYearsResource();
  readonly availableYears = computed(() => this.availableYearsResource.value() ?? [new Date().getFullYear()]);

  onFilterChanged(params: SharedFilterParams): void {
    this.filterParams.set(params as unknown as FilterExpenseParams);
  }
}