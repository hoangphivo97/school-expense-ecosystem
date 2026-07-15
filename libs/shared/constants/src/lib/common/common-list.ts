import { NavItem, NavItemConfig } from '@school-expense-ecosystem/shared/types';

export const months = [
  { value: null, label: 'All Month' },
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

export const navItems: NavItemConfig[] = [
  { icon: 'local_atm', label: 'My Expenses', key: NavItem.EXPENSE },
  {
    key: NavItem.APPROVAL_CENTER,
    label: 'Approval Center',
    icon: 'assignment_turned_in',
    children: [
      { label: 'Pending Queue', route: '/expense/pending', icon: 'hourglass_empty' }, // FIFO Queue
      { label: 'Faculty History', route: '/expense/history', icon: 'history' } // LIFO Archive
    ]
  },
  { icon: 'accessibility_new', label: 'User', key: NavItem.USER_LIST },
  {
    icon: 'insert_chart_outlined',
    label: 'Report',
    key: NavItem.REPORT,
  },
  { icon: 'account_balance', label: 'Budget Manager', key: NavItem.BUDGET_MANAGER },
  { icon: 'dashboard', label: 'Dashboard', key: NavItem.DASHBOARD }
];

export const mainColorPieChart: string[] = [
  '#7D45FF',
  '#A27BE7',
  '#4666D4',
  '#35B4C0',
];
