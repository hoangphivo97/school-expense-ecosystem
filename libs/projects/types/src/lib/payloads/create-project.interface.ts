import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { ProjectFundingType } from '../enums/project.enum';

export interface CreateProjectPayload {
  name: string;
  type: ProjectFundingType;
  budgetCap: number;
  currentSpent?: number;
  facultyId: FacultyId;
  mentorId: string;
  deanId?: string;
  startDate: string;
  endDate: string;
  maxUses: number;
  expiresAt: string;
}

export interface GenerateJoinCodePayload {
  maxUses: number;
  expiresAt: string;
}

export interface JoinProjectByCodePayload {
  code: string;
}