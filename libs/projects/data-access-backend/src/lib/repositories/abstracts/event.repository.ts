import { Event, EventQueryPayload, CreateEventPayload, UpdateEventPayload, StudentSummary } from '@school-expense-ecosystem/projects/types';

export abstract class EventRepository {
  abstract findById(id: string): Promise<Event | null>;
  abstract findMany(query: EventQueryPayload): Promise<{ items: Event[]; total: number }>;
  abstract create(data: CreateEventPayload & { organizerId: string }): Promise<Event>;
  abstract update(id: string, data: UpdateEventPayload): Promise<Event>;
  abstract findByJoinCode(code: string): Promise<Event | null>;
  abstract addStudentsBulk(id: string, studentIds: string[]): Promise<void>;
  abstract removeStudent(id: string, studentUid: string): Promise<void>;
  abstract searchStudents(query: string, limitCount?: number): Promise<StudentSummary[]>;
  abstract enrollStudentViaCode(eventId: string, studentId: string): Promise<Event>;
}