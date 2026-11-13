/**
 * Classifies the official institutional document authorizing a budget ledger mutation.
 */
export enum BudgetReferenceDocType {
  /** Annual allocation approved by the Administrative Meeting (行政會議決議) */
  ADMINISTRATIVE_MEETING_RESOLUTION = 'ADMINISTRATIVE_MEETING_RESOLUTION',
  /** Allocation approved by the University Budget Committee (預算分配委員會決議) */
  BUDGET_COMMITTEE_APPROVAL = 'BUDGET_COMMITTEE_APPROVAL',
  /** Signed internal memo authorizing mid-year top-up or deduction (核定簽呈) */
  OFFICIAL_MEMO = 'OFFICIAL_MEMO',
  /** Formal university dispatch notice (學校核定公文 / 函文) */
  OFFICIAL_DISPATCH = 'OFFICIAL_DISPATCH',
  /** Final settlement report for reclaiming unused activity funds (結案報告) */
  SETTLEMENT_REPORT = 'SETTLEMENT_REPORT',
}