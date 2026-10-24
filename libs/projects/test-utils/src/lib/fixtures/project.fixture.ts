import { FacultyId } from '@school-expense-ecosystem/shared/types';
import {
  ProjectFundingType,
  ProjectItem,
  ProjectStatus,
} from '@school-expense-ecosystem/projects/types';

// Default mock factory for ProjectItem entity
export const createMockProjectItem = (
  overrides?: Partial<ProjectItem>
): ProjectItem => ({
  id: 'PRJ-FIT-001',
  name: 'AI Research Platform',
  description: 'Default mock project description for testing',
  type: ProjectFundingType.FACULTY,
  status: ProjectStatus.PENDING_DEAN_APPROVAL,
  budgetCap: 20000000,
  initialSpent: 0,
  currentSpent: 0,
  pendingSpent: 0,
  mentorId: 'mentor-uid-01',
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