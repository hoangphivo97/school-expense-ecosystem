import { EventItem, EventQueryPayload, CreateEventPayload, UpdateEventPayload, StudentSummary } from '@school-expense-ecosystem/projects/types';

export abstract class EventRepository {
  abstract create(event: EventItem): Promise<EventItem>;
  abstract findById(id: string): Promise<EventItem | null>;
  abstract update(id: string, data: Partial<EventItem>): Promise<void>;
  abstract findByJoinCode(code: string): Promise<EventItem | null>;

  abstract addStudentsBulk(id: string, studentUids: string[]): Promise<void>;
  abstract removeStudent(id: string, studentUid: string): Promise<void>;
  abstract updateJoinConfig(id: string, config: EventItem['joinConfig']): Promise<void>;

  abstract updateSpentCounters(
    id: string,
    deltas: { pendingSpentDelta?: number; currentSpentDelta?: number }
  ): Promise<void>;

  abstract findWithQuery(query: EventQueryPayload): Promise<{ items: EventItem[]; total: number }>;
  abstract searchStudents(query: string, limitCount?: number): Promise<StudentSummary[]>;
  abstract enrollStudentViaCode(eventId: string, studentId: string): Promise<EventItem>;
  abstract createWithFacultyFund(event: EventItem, departmentFundId: string): Promise<EventItem>;
}