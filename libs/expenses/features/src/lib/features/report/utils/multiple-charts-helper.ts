export function makeLineChart(rawData: { label: string; amount: number }[]) {
  return {
    series: [{ name: 'Operational Outflow', data: rawData.map((d) => d.amount) }],
    chart: { type: 'line' as const, height: 350 },
    xaxis: {
      categories: rawData.map((d) => d.label),
      labels: { style: { colors: '#888' } },
    },
    stroke: { curve: 'smooth' as const, width: 3 },
    title: { text: 'Expense Accumulation Matrix Over Time', align: 'left' as const, style: { color: '#aaa' } },
  };
}

export function makePieChart(rawData: { label: string; amount: number }[]) {
  return {
    series: rawData.map((d) => d.amount),
    labels: rawData.map((d) => d.label),
    chart: { type: 'pie' as const, height: 350 },
    title: { text: 'Payment Method Structural Breakdown', align: 'left' as const, style: { color: '#aaa' } },
    legend: { position: 'bottom' as const },
    dataLabels: { enabled: true },
    plotOptions: { pie: { expandOnClick: true } },
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()} TWD` },
    },
  };
}

export function makeMonthlyColumnChart(rawData: { label: string; amount: number }[]) {
  return {
    series: [{ name: 'Monthly Aggregate Outflow', data: rawData.map((d) => d.amount) }],
    // 🌟 FIX: Ép kiểu 'bar' as const
    chart: { type: 'bar' as const, height: 350},
    xaxis: {
      categories: rawData.map((d) => d.label),
      labels: { style: { colors: '#888' } },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    title: { text: 'Monthly Budget Distribution Matrix', align: 'left' as const, style: { color: '#aaa' } },
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()} TWD` },
    },
  };
}