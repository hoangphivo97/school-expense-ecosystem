import { FacultyId, CursorPaginationParams } from "@school-expense-ecosystem/shared/types";
import { JoinConfig } from "../models/shared.interface";

export interface GenerateJoinCodePayload {
  maxUses?: number | null;
  startsAt: string;
  expiresAt: string;
}

export interface JoinByCodePayload {
  code: string;
}

export interface ManageParticipantsPayload {
  userIds: string[];
}

export type AddParticipantsPayload = ManageParticipantsPayload;

export interface RejectActivityPayload {
  reason?: string | null;
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
  joinCodeConfig?: CreateJoinCodeConfig | null;
}

// Base update payload mirroring BaseUpdateActivityDto
export interface BaseUpdateActivityPayload<TFundingType> extends Partial<BaseActivityPayload<TFundingType>> {
  joinConfig?: JoinConfig | null;
  rejectionReason?: string | null;
  expectedUpdatedAt: string;
}

export interface BaseActivityQueryPayload<TStatus, TType> extends CursorPaginationParams {
  page?: number;
  search?: string;
  facultyId?: FacultyId;
  status?: TStatus;
  studentId?: string;
  year?: number;
  type?: TType;
}

export interface CreateJoinCodeConfig {
  maxUses?: number | null;
  expiresAt?: string | null;
}