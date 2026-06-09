import { NavItem } from '@school-expense-ecosystem/shared/types';

export const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const navItems = [
  { icon: 'local_atm', label: 'Expenses', key: NavItem.EXPENSE },
  { icon: 'accessibility_new', label: 'User', key: NavItem.USER },
  {
    icon: 'insert_chart_outlined',
    label: 'Report',
    route: '/report',
    key: NavItem.REPORT,
  },
  { icon: 'message', label: 'Messages', key: NavItem.MESSAGE },
  { icon: 'dashboard', label: 'Budget Manager', key: NavItem.BUDGET_MANAGER}
];

export const mainColorPieChart: string[] = [
  '#7D45FF',
  '#A27BE7',
  '#4666D4',
  '#35B4C0',
];
