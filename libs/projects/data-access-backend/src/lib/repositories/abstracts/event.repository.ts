import { Event, EventQueryPayload, CreateEventPayload, UpdateEventPayload } from '@school-expense-ecosystem/projects/types';

export abstract class EventRepository {
  abstract findById(id: string): Promise<Event | null>;
  abstract findMany(query: EventQueryPayload): Promise<{ items: Event[]; total: number }>;
  abstract create(data: CreateEventPayload & { organizerId: string }): Promise<Event>;
  abstract update(id: string, data: UpdateEventPayload): Promise<Event>;
  abstract delete(id: string): Promise<void>;
}