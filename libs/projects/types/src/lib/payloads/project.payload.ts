import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { ProjectFundingType, ProjectStatus } from '../enums/project.enum';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  type: ProjectFundingType;
  budgetCap: number;
  initialSpent?: number;
  facultyId: FacultyId;
  startDate: string;
  endDate: string;
  generateJoinCode?: boolean;
  maxUses?: number;
  expiresAt?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  type?: ProjectFundingType;
  facultyId?: FacultyId;
  budgetCap?: number;
  initialSpent?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProjectQueryPayload {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: FacultyId;
  mentorId?: string;
  status?: ProjectStatus;
  studentId?: string;
}

export interface GenerateJoinCodePayload {
  maxUses: number;
  expiresAt: string;
}

export interface JoinProjectByCodePayload {
  code: string;
}
