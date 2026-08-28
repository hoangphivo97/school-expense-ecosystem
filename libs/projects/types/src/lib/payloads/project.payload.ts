import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { ProjectFundingType, ProjectStatus } from '../enums/project.enum';
import { JoinConfig } from '../models/shared.interface';

export interface CreateProjectPayload {
  name: string;
  description?: string | null;
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

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus;
  joinConfig?: JoinConfig | null;
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

