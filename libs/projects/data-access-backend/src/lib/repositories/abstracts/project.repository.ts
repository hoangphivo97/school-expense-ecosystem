import { Project } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

export abstract class ProjectRepository {
  abstract create(project: Project): Promise<Project>;
  abstract findById(id: string): Promise<Project | null>;
  abstract update(id: string, data: Partial<Project>): Promise<void>;
  abstract addStudentsBulk(id: string, studentUids: string[]): Promise<void>;
  abstract updateJoinConfig(id: string, config: Project['joinConfig']): Promise<void>;
  abstract findAll(filters?: { facultyId?: FacultyId }): Promise<Project[]>;
  abstract findProjectsByStudentId(studentUid: string): Promise<Project[]>;
  abstract findProjectsByMentorId(mentorUid: string): Promise<Project[]>;
}