import { FacultyId } from '@school-expense-ecosystem/shared/types';
import {
  EventFundingType,
  EventItem,
  EventStatus,
} from '@school-expense-ecosystem/projects/types';

// Default mock factory for EventItem entity
export const createMockEventItem = (
  overrides?: Partial<EventItem>
): EventItem => ({
  id: 'EVT-FIT-001',
  name: 'Tech Seminar 2026',
  description: 'Default mock event description for testing',
  type: EventFundingType.FACULTY,
  status: EventStatus.PENDING_DEAN_APPROVAL,
  budgetCap: 10000000,
  initialSpent: 0,
  currentSpent: 0,
  pendingSpent: 0,
  organizerId: 'organizer-uid-01',
  projectId: undefined,
  facultyId: FacultyId.FIT,
  joinedStudentIds: ['stu-01'],
  joinConfig: null,
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  years: [2026],
  ...overrides,
});