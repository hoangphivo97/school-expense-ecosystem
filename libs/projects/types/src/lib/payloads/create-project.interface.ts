import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { ProjectFundingType } from '../enums/project.enum';

export interface CreateProjectPayload {
  name: string;
  type: ProjectFundingType;
  budgetCap: number;
  currentSpent?: number;
  facultyId: FacultyId;
  deanId?: string;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  expiresAt: string;
  initialSpent?: number;
  initialSpentReason?: string;
  initialSpentProofUrls?: string[];
}

export interface GenerateJoinCodePayload {
  maxUses: number;
  expiresAt: string;
}

export interface JoinProjectByCodePayload {
  code: string;
}