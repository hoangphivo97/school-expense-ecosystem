export enum BudgetTransactionType {
  /** Initial annual budget allocation approved for a faculty (年度預算分配) */
  INITIAL_ALLOCATION = 'INITIAL_ALLOCATION',
  /** Mid-year supplemental budget increase (追加預算) */
  TOP_UP = 'TOP_UP',
  /** Mid-year budget reduction or clawback (追減預算 / 減列預算) */
  DEDUCTION = 'DEDUCTION',
  /** Funds earmarked from department remaining balance for an internal activity (經費動支) */
  PROJECT_ALLOCATION = 'PROJECT_ALLOCATION',
  /** Unspent funds reclaimed back to department balance upon settlement (結案餘額繳回) */
  PROJECT_REFUND_RECLAIM = 'PROJECT_REFUND_RECLAIM',
  /** Unspent annual allocation lapsed back to central university fund at fiscal year-end (年度餘額繳庫) */
  YEAR_END_LAPSE = 'YEAR_END_LAPSE',
}