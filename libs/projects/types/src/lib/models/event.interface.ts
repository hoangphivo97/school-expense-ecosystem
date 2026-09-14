import { EventFundingType, EventStatus } from '../enums/event.enum';
import { BaseActivityItem } from './shared.interface';

export interface EventItem extends BaseActivityItem<EventFundingType, EventStatus> {
  organizerId: string;
  projectId?: string | null;
}

export interface FilterEventParams {
  facultyId?: string;
  status?: EventStatus;
  type?: EventFundingType;
  mentorId?: string;
  studentId?: string;
  search?: string;
}

export interface PaginatedEventResult {
  items: EventItem[];
  nextPageToken: string | null;
  totalItems: number;
}