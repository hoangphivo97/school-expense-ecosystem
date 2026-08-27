// libs/projects/types/src/lib/models/event.interface.ts
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus } from '../enums/event.enum';

export interface EventJoinConfig {
  code: string;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  facultyId: FacultyId;
  type: EventFundingType;
  budgetCap: number;
  currentSpent: number;
  initialSpent: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  status: EventStatus;
  organizerId: string;
  joinedStudentIds: string[];
  joinConfig?: EventJoinConfig;
  createdAt: string;
  updatedAt: string;
}