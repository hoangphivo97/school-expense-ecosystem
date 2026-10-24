import { EventFundingType, EventStatus } from '../enums/event.enum';
import { BaseActivityPayload, BaseActivityQueryPayload, BaseUpdateActivityPayload } from './shared.payload';

export interface CreateEventPayload extends BaseActivityPayload<EventFundingType> {
  projectId?: string;
}

export interface UpdateEventPayload extends BaseUpdateActivityPayload<EventFundingType> {
  projectId?: string;
  status?: EventStatus;
}

export interface EventQueryPayload extends BaseActivityQueryPayload<EventStatus, EventFundingType> {
  projectId?: string;
  organizerId?: string;
}

export interface RejectEventPayload {
  reason: string;
}