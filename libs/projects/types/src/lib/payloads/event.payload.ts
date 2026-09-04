import { EventFundingType, EventStatus } from '../enums/event.enum';
import { JoinConfig } from '../models/shared.interface';
import { BaseActivityPayload, BaseActivityQueryPayload } from './shared.payload';

export interface CreateEventPayload extends BaseActivityPayload<EventFundingType> {
  projectId?: string;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: EventStatus;
  joinConfig?: JoinConfig | null;
  rejectionReason?: string | null;
}

export interface EventQueryPayload extends BaseActivityQueryPayload<EventStatus> {
  projectId?: string;
  organizerId?: string;
}