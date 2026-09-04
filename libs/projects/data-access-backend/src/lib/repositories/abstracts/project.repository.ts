import { ProjectItem, ProjectQueryPayload, StudentSummary } from '@school-expense-ecosystem/projects/types';

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

  abstract findWithQuery(query: ProjectQueryPayload): Promise<{ items: ProjectItem[]; total: number }>;
  abstract searchStudents(query: string, limitCount?: number): Promise<StudentSummary[]>;
  abstract enrollStudentViaCode(projectId: string, studentId: string): Promise<ProjectItem>;
  abstract createWithFacultyFund(project: ProjectItem, departmentFundId: string): Promise<ProjectItem>;
}