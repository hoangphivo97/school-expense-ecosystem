// libs/projects/types/src/lib/payloads/event.payload.ts
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus } from '../enums/event.enum';

export interface CreateEventPayload {
  name: string;
  description?: string;
  projectId?: string;
  facultyId: FacultyId;
  type: EventFundingType;
  budgetCap: number;
  initialSpent?: number;
  startDate: string;
  endDate: string;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: EventStatus;
}

export interface EventQueryPayload {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: FacultyId;
  status?: EventStatus;
  projectId?: string;
}