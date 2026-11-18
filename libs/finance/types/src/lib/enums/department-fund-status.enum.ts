/**
 * Represents the lifecycle state of a department's annual budget fund.
 */
export enum DepartmentFundStatus {
  /** Open for normal allocations, top-ups, deductions, and expenditures (執行中) */
  ACTIVE = 'ACTIVE',
  /** Temporarily locked during mid-year audit or pre-closing cutoff (凍結中 / 關帳前凍結) */
  FROZEN = 'FROZEN',
  /** Fiscal year finalized; no further mutations permitted (已結案 / 關帳) */
  CLOSED = 'CLOSED',
}