import { BudgetLedgerSourceType, BudgetTransactionType } from '@school-expense-ecosystem/finance/types';
import { EnrolledActivityOption, PaginatedProjectResult, ProjectItem, ProjectQueryPayload, ProjectStatus, StudentSummary } from '@school-expense-ecosystem/projects/types';

export abstract class ProjectRepository {
  abstract create(project: ProjectItem): Promise<ProjectItem>;
  abstract findById(id: string): Promise<ProjectItem | null>;
  abstract update(id: string, data: Partial<ProjectItem>): Promise<void>;
  abstract findByJoinCode(code: string): Promise<ProjectItem | null>;

  abstract addStudentsBulk(id: string, studentUids: string[]): Promise<void>;
  abstract removeStudent(id: string, studentUid: string): Promise<void>;
  abstract updateJoinConfig(id: string, config: ProjectItem['joinConfig']): Promise<void>;

  abstract updateSpentCounters(
    id: string,
    deltas: { pendingSpentDelta?: number; currentSpentDelta?: number }
  ): Promise<void>;

  abstract findWithQuery(query: ProjectQueryPayload): Promise<PaginatedProjectResult>;
  abstract searchStudents(query: string, limitCount?: number): Promise<StudentSummary[]>;
  abstract enrollStudentViaCode(projectId: string, studentId: string, expectedCode: string, allowedStatuses: ProjectStatus[]): Promise<ProjectItem>;
  abstract updateWithOptimisticLock(
    id: string,
    data: Partial<ProjectItem>,
    expectedUpdatedAt: string
  ): Promise<ProjectItem>;

  /**
   * Atomic state machine transition contract
   */
  abstract transitionStatus(
    id: string,
    targetStatus: string,
    allowedCurrentStatuses: string[],
    additionalData?: Record<string, unknown>
  ): Promise<ProjectItem>;

  abstract findActiveSummariesForUser(userId: string): Promise<EnrolledActivityOption[]>;
  abstract approveWithFundAllocation(
    id: string,
    departmentFundId: string,
    targetStatus: ProjectStatus,
    allowedCurrentStatuses: ProjectStatus[],
    ledgerMeta: {
      transactionType: BudgetTransactionType;
      sourceType: BudgetLedgerSourceType;
    },
    auditData: Record<string, unknown> & {
      approvedBy: string;
      approvedByEmail?: string;
      approvedAt: string;
    }
  ): Promise<ProjectItem>;
}