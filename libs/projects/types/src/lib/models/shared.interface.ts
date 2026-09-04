import { FacultyId } from "@school-expense-ecosystem/shared/types";

export interface JoinConfig {
  code: string;
  isActive: boolean;
  maxUses?: number;
  usedCount?: number;
  startsAt?: string;   // ISO 8601
  expiresAt?: string;  // ISO 8601
  createdAt: string;   // ISO 8601
}

export interface BaseActivityItem<TFundingType, TStatus> {
  id: string;
  name: string;
  description?: string | null;
  type: TFundingType;
  status: TStatus;
  facultyId: FacultyId;
  budgetCap: number;
  initialSpent: number;
  currentSpent: number;
  pendingSpent?: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  joinConfig?: JoinConfig | null;
  joinedStudentIds: string[];
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSummary {
    id: string;
    studentCode: string;
    fullName: string;
    email: string;
}

export interface ActivityCapacityMetrics {
  participantCount: number;
  maxParticipants?: number;
  enrollmentPercentage?: number;
  isCapacityFull: boolean;
}

export interface BaseActivityViewModel extends ActivityCapacityMetrics {
  canEdit: boolean;
  canApprove?: boolean;
  canReject?: boolean;
}