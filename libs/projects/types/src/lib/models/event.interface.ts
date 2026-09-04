import { EventFundingType, EventStatus } from '../enums/event.enum';
import { BaseActivityItem } from './shared.interface';

export interface EventItem extends BaseActivityItem<EventFundingType, EventStatus> {
  organizerId: string;
  projectId?: string | null;
}