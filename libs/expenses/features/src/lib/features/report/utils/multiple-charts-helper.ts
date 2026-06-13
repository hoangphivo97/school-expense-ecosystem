// libs/expenses/features/src/lib/features/report/utils/multiple-charts-helper.ts
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexStroke,
  ApexXAxis,
  ApexTitleSubtitle,
  ChartType,
} from 'ng-apexcharts';
import { AxisChartOptions, NonAxisChartOptions, ExpenseList } from '@school-expense-ecosystem/expenses/types';
import { formatDate } from '@angular/common';

export type LineOpts = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke?: ApexStroke;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
};

/**
 * Groups expense list by their purpose categories
 */
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

/**
 * Generates configuration for a smooth line chart tracking expenses over time
 */
export function makeLineChart(
  expenses: ExpenseList[],
): Partial<AxisChartOptions> {
  // e.date is now a clean ISO string, safely handled by Angular's natively flexible formatDate utility
  const categories = expenses.map((e) =>
    formatDate(e.date, 'MMM dd', 'en-US'),
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

/**
 * Generates configuration for a vertical monthly column chart for a specific year
 */
export function makeMonthlyColumnChart(
  expenses: ExpenseList[],
  year: number,
  opts?: { title?: string; height?: number; seriesName?: string },
): Partial<AxisChartOptions> {
  const height = opts?.height ?? 300;
  const seriesName = opts?.seriesName ?? 'Monthly Expenses';

  // Initialize an array with 12 slots for 12 months, starting at 0
  const monthly = Array.from({ length: 12 }, () => 0);

  for (const e of expenses) {
    if (!e.date) continue;

    // Directly construct a native JavaScript Date object from the clean ISO string format
    const d = new Date(e.date);
    if (isNaN(d.getTime())) continue; // Skip invalid date strings safely
    if (d.getFullYear() !== year) continue; // Only process calculations within the specified target year

    const mIndex = d.getMonth(); // Index range maps 0 (Jan) to 11 (Dec)
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
        horizontal: false, // Column chart representation (vertical bars)
        columnWidth: '48%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
  };
}

/**
 * Generates configuration for a pie or donut chart broken down by category breakdown
 */
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
  const donut = opts?.donut ?? true; // Default behavior defaults to the donut aspect ratio

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
      // Renders percentage breakdown into graph data label context cleanly
      formatter: (val: any) => `${Number(val).toFixed(1)}%`,
    },
    // Renders centralized aggregated totals for donut charts exclusively
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
      y: { formatter: (v: number) => `${v}` }, // Displays absolute raw values in chart tooltips
    },
  };
}