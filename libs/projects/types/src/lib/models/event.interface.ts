// libs/projects/types/src/lib/models/event.interface.ts
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus } from '../enums/event.enum';
import { JoinConfig } from './shared.interface';

export interface EventItem {
  id: string;
  name: string;
  description?: string;
  facultyId: FacultyId;
  type: EventFundingType;
  projectId?: string | null;
  budgetCap: number;
  currentSpent: number;
  initialSpent: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  status: EventStatus;
  organizerId: string;
  joinedStudentIds: string[];
  joinConfig?: JoinConfig | null;
  createdAt: string;
  updatedAt: string;
  pendingSpent?: number;
  rejectionReason?: string | null;
}