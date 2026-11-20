const CHART_SERIES_PALETTE = [
  '#7d45ff', // Brand Purple
  '#10b981', // Emerald
  '#3b82f6', // Azure Blue
  '#f59e0b', // Amber
  '#ef4444', // Coral Red
];

export function makeLineChart(rawData: { label: string; amount: number }[]) {
  return {
    series: [{ name: 'Operational Outflow', data: rawData.map((d) => d.amount) }],
    chart: { type: 'line' as const, height: 350 },
    colors: [CHART_SERIES_PALETTE[0]],
    xaxis: {
      categories: rawData.map((d) => d.label),
    },
    stroke: { curve: 'smooth' as const, width: 3 },
    title: { text: 'Expense Accumulation Matrix Over Time', align: 'left' as const },
  };
}

export function makePieChart(rawData: { label: string; amount: number }[]) {
  return {
    series: rawData.map((d) => d.amount),
    labels: rawData.map((d) => d.label),
    chart: { type: 'pie' as const, height: 350 },
    title: { text: 'Payment Method Structural Breakdown', align: 'left' as const },
    legend: { position: 'bottom' as const },
    dataLabels: { enabled: true },
    plotOptions: { pie: { expandOnClick: true } },
    colors: CHART_SERIES_PALETTE,
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()} TWD` },
    },
  };
}

export function makeMonthlyColumnChart(rawData: { label: string; amount: number }[]) {
  return {
    series: [{ name: 'Monthly Aggregate Outflow', data: rawData.map((d) => d.amount) }],
    chart: { type: 'bar' as const, height: 350 },
    colors: [CHART_SERIES_PALETTE[0]],
    xaxis: {
      categories: rawData.map((d) => d.label),
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    title: { text: 'Monthly Budget Distribution Matrix', align: 'left' as const },
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()} TWD` },
    },
  };
}