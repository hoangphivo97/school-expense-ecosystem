import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexLegend,
  ApexPlotOptions,
  ApexNonAxisChartSeries,
  ApexTooltip,
} from 'ng-apexcharts';

export type AxisChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  stroke?: ApexStroke;
  plotOptions?: ApexPlotOptions;
  dataLabels?: ApexDataLabels;
  legend?: ApexLegend;
  title?: ApexTitleSubtitle;
  tooltip?: ApexTooltip;
  colors?: string[];
};

export type NonAxisChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels?: string[];
  dataLabels?: ApexDataLabels;
  legend?: ApexLegend;
  title?: ApexTitleSubtitle;
  plotOptions?: ApexPlotOptions;
  tooltip?: ApexTooltip;
  colors?: string[];
};
