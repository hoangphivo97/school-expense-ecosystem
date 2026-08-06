import { Project } from '@school-expense-ecosystem/finance/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

export abstract class ProjectRepository {
  abstract create(project: Project): Promise<Project>;
  abstract findById(id: string): Promise<Project | null>;
  abstract update(id: string, data: Partial<Project>): Promise<void>;
  abstract addStudentsBulk(id: string, studentIds: string[]): Promise<void>;
  abstract updateJoinConfig(id: string, config: Project['joinConfig']): Promise<void>;
  abstract findAll(filters?: { facultyId?: FacultyId }): Promise<Project[]>;
}