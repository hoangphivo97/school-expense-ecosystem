import { ExpenseStatus, NavItem, NavItemConfig } from '@school-expense-ecosystem/shared/types';

export const months = [
  { value: null, label: 'ALL' },
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

export const APP_NAVIGATION: NavItemConfig[] = [
  {
    key: NavItem.PROJECT_OVERVIEW, label: 'Dashboard', icon: 'dashboard', 
    children: [
      { label: 'Project Overview', route: '/project-overview', icon: 'info' },
      { label: 'Dashboard', route: '/dashboard', icon: 'insert_chart' }
    ]
  },
  { key: NavItem.EXPENSE, label: 'My Expenses', icon: 'local_atm', route: '/expense' },
  {
    key: NavItem.APPROVAL_CENTER,
    label: 'Approval Center',
    icon: 'assignment_turned_in',
    children: [
      { label: 'Pending Queue', route: '/expense/pending', icon: 'hourglass_empty' },
      { label: 'Faculty History', route: '/expense/history', icon: 'history' }
    ]
  },
  { key: NavItem.USER_LIST, label: 'User', icon: 'accessibility_new', route: '/user-list' },
  { key: NavItem.REPORT, label: 'Report', icon: 'insert_chart_outlined', route: '/report' },
  { key: NavItem.BUDGET_MANAGER, label: 'Budget Manager', icon: 'account_balance', route: '/budget-manager' },
  { key: NavItem.PROJECT_MANAGER, label: 'Projects', icon: 'folder_open', route: '/project-manager/overview' },

];

export const mainColorPieChart: string[] = [
  '#7D45FF',
  '#A27BE7',
  '#4666D4',
  '#35B4C0',
];

export const ROUTE_HEADER_TITLE_REGISTRY: Record<string, string> = {
  '/expense/pending': 'Review Inbox Queue',
  '/expense/history': 'Faculty Expense History',
  '/dashboard': 'Dashboard Overview',
  '/user-list': 'System User Directory',
  '/expense': 'My Personal Claims',
  '/report': 'Financial Reports',
  '/budget-manager': 'Budget Management',
  '/project-manager/overview': 'Project Management',
  '/project-manager/events': 'Events Management',
};

export const EXPENSE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: ExpenseStatus.PENDING_TEACHER_REVIEW, label: 'Pending Teacher' },
  { value: ExpenseStatus.PENDING_DEAN_APPROVAL, label: 'Pending Dean' },
  { value: ExpenseStatus.PENDING_DISBURSEMENT, label: 'Pending Disbursement' },
  { value: ExpenseStatus.DISBURSED, label: 'Disbursed' },
  { value: ExpenseStatus.REJECTED, label: 'Rejected' }
];