import {
  ApexAxisChartSeries,
  ApexChart,
  ApexStroke,
  ApexXAxis,
  ApexTitleSubtitle,
  ChartType,
} from 'ng-apexcharts';
import { AxisChartOptions, NonAxisChartOptions } from '@school-expense-ecosystem/expenses/data-access';
import { formatDate } from '@angular/common';
import { tsToDate, tsToMs } from '@school-expense-ecosystem/shared/utils';
import { Timestamp } from '@angular/fire/firestore';
import { ExpenseList } from '@school-expense-ecosystem/expenses/data-access';

export type LineOpts = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke?: ApexStroke;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
};

function groupByCategory(list: ExpenseList[]) {
  const b: Record<string, number> = {};
  for (const e of list) {
    const key = (e.purpose || 'Others').trim();
    b[key] = (b[key] || 0) + (Number(e.amount) || 0);
  }
  const labels = Object.keys(b);
  const series = labels.map((k) => b[k]);
  return { labels, series };
}

export function makeLineChart(
  expenses: ExpenseList[],
): Partial<AxisChartOptions> {
  const categories = expenses.map((e) =>
    formatDate(tsToDate(e.date as Timestamp) as Date, 'MMM dd', 'en-US'),
  );
  const data = expenses.map((e) => e.amount);

  return {
    title: { text: 'Expenses Over Time' },
    chart: { type: 'line', height: 350, width: '100%' },
    stroke: { curve: 'smooth' },
    xaxis: { categories },
    series: [{ name: 'Expenses', data, color: '#7D45FF' }],
  };
}

export function makeMonthlyColumnChart(
  expenses: ExpenseList[],
  year: number,
  opts?: { title?: string; height?: number; seriesName?: string },
): Partial<AxisChartOptions> {
  const height = opts?.height ?? 300;
  const seriesName = opts?.seriesName ?? 'Monthly Expenses';

  // khởi tạo 12 tháng = 0
  const monthly = Array.from({ length: 12 }, () => 0);

  for (const e of expenses) {
    const ms = tsToMs(e.date as Timestamp);
    if (!Number.isFinite(ms)) continue;
    const d = new Date(ms);
    if (d.getFullYear() !== year) continue; // chỉ tính trong năm cần hiển thị
    const mIndex = d.getMonth(); // 0..11
    monthly[mIndex] += Number(e.amount) || 0;
  }

  const categories = Array.from(
    { length: 12 },
    (_, i) => new Date(year, i, 1).toLocaleString('en-US', { month: 'short' }), // Jan..Dec
  );

  return {
    chart: { type: 'bar' as ChartType, height, width: '100%' },
    title: opts?.title ? { text: opts.title } : undefined,
    xaxis: { categories },
    series: [{ name: seriesName, data: monthly, color: '#7D45FF' }],
    plotOptions: {
      bar: {
        horizontal: false, // column chart (vertical)
        columnWidth: '48%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
  };
}

export function makePieChart(
  expenses: ExpenseList[],
  opts?: {
    title?: string;
    height?: number;
    colors?: string[];
    donut?: boolean;
  },
): Partial<NonAxisChartOptions> {
  const { labels, series } = groupByCategory(expenses);
  const height = opts?.height ?? 300;
  const donut = opts?.donut ?? true; // default donut

  return {
    chart: {
      type: (donut ? 'donut' : 'pie') as ChartType,
      height,
      width: '100%',
    },
    title: opts?.title ? { text: opts.title } : undefined,
    labels,
    series,
    colors: opts?.colors,
    legend: { position: 'bottom' },
    dataLabels: {
      enabled: true,
      // hiển thị % (Apex truyền % vào formatter)
      formatter: (val: any) => `${Number(val).toFixed(1)}%`,
    },
    // tổng ở giữa khi là donut (tuỳ thích)
    plotOptions: donut
      ? {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  formatter: (w: any) => {
                    const s: number[] = w?.globals?.series || [];
                    return String(s.reduce((a, b) => a + b, 0));
                  },
                },
              },
            },
          },
        }
      : undefined,
    tooltip: {
      y: { formatter: (v: number) => `${v}` }, // giá trị tuyệt đối trong tooltip
    },
  };
}
