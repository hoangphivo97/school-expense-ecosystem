import { Event, EventQueryPayload, CreateEventPayload, UpdateEventPayload, StudentSummary } from '@school-expense-ecosystem/projects/types';

export abstract class EventRepository {
  abstract create(event: Event): Promise<Event>;
  abstract findById(id: string): Promise<Event | null>;
  abstract update(id: string, data: Partial<Event>): Promise<void>;
  abstract findByJoinCode(code: string): Promise<Event | null>;

  abstract addStudentsBulk(id: string, studentUids: string[]): Promise<void>;
  abstract removeStudent(id: string, studentUid: string): Promise<void>;
  abstract updateJoinConfig(id: string, config: Event['joinConfig']): Promise<void>;

  abstract updateSpentCounters(
    id: string,
    deltas: { pendingSpentDelta?: number; currentSpentDelta?: number }
  ): Promise<void>;

  abstract findWithQuery(query: EventQueryPayload): Promise<{ items: Event[]; total: number }>;
  abstract searchStudents(query: string, limitCount?: number): Promise<StudentSummary[]>;
  abstract enrollStudentViaCode(eventId: string, studentId: string): Promise<Event>;
  abstract createWithFacultyFund(event: Event, departmentFundId: string): Promise<Event>;
}