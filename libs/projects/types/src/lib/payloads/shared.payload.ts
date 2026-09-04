import { FacultyId } from "@school-expense-ecosystem/shared/types";

export interface GenerateJoinCodePayload {
  maxUses?: number;
  startsAt: string;
  expiresAt: string;
}

export interface JoinByCodePayload {
  code: string;
}

export interface ManageParticipantsPayload {
  userIds: string[];
}

export interface BaseActivityPayload<TFundingType> {
  name: string;
  description?: string | null;
  type: TFundingType;
  facultyId: FacultyId;
  budgetCap: number;
  initialSpent?: number;
  startDate: string;
  endDate: string;
  // Optional Join Code Inline Creation
  joinCodeConfig?: CreateJoinCodeConfig;
}

export interface BaseActivityQueryPayload<TStatus> {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: FacultyId;
  status?: TStatus;
  studentId?: string;
}

export interface CreateJoinCodeConfig {
  maxUses?: number;
  expiresAt?: string;
}