import { Project, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';

export abstract class ProjectRepository {
  abstract create(project: Project): Promise<Project>;
  abstract findById(id: string): Promise<Project | null>;
  abstract update(id: string, data: Partial<Project>): Promise<void>;
  abstract findByJoinCode(code: string): Promise<Project | null>;

  abstract addStudentsBulk(id: string, studentUids: string[]): Promise<void>;
  abstract removeStudent(id: string, studentUid: string): Promise<void>;
  abstract updateJoinConfig(id: string, config: Project['joinConfig']): Promise<void>;

  abstract updateSpentCounters(
    id: string,
    deltas: { pendingSpentDelta?: number; currentSpentDelta?: number }
  ): Promise<void>;

  abstract findWithQuery(query: ProjectQueryPayload): Promise<{ items: Project[]; total: number }>;
  abstract findProjectsByStudentId(studentUid: string): Promise<Project[]>;
  abstract findProjectsByMentorId(mentorUid: string): Promise<Project[]>;
}