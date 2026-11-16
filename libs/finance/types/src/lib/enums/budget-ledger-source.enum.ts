export enum BudgetLedgerSourceType {
  /** Direct administrative action by a Finance officer backed by an official document */
  MANUAL_FINANCE_ACTION = 'MANUAL_FINANCE_ACTION',
  /** Automated balance lock/release triggered by a faculty-funded Project lifecycle */
  PROJECT = 'PROJECT',
  /** Automated balance lock/release triggered by a faculty-funded Event lifecycle */
  EVENT = 'EVENT',
  /** Automated fiscal year-end closing process */
  YEAR_END_CLOSING = 'YEAR_END_CLOSING',
}