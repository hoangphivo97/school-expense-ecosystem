import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import { EventRepository } from '../repositories/abstracts/event.repository';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { EventService } from './event.service';
import { JoinCodeService } from './join-code.service';
import { createMockProjectItem } from '@school-expense-ecosystem/projects/test-utils';
import { CreateEventDto } from '@school-expense-ecosystem/projects/features-backend';
import { EventOutsideParentProjectTimelineException, EventParentProjectRequiredException } from '../exceptions/event.exception';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';

describe('EventService', () => {
  let service: EventService;
  let eventRepo: jest.Mocked<EventRepository>;
  let projectRepo: jest.Mocked<ProjectRepository>;

  const mockEventRepo = {
    findWithQuery: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    createWithFacultyFund: jest.fn(),
    transitionStatus: jest.fn(),
  };

  const mockProjectRepo = {
    findById: jest.fn(),
    updateSpentCounters: jest.fn(),
  };

  const mockUserRepo = {
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        JoinCodeService,
        { provide: EventRepository, useValue: mockEventRepo },
        { provide: ProjectRepository, useValue: mockProjectRepo },
        { provide: UserRepository, useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventRepo = module.get(EventRepository);
    projectRepo = module.get(ProjectRepository);
    jest.clearAllMocks();
  });

  describe('getEventsForUser - Role Scoping Matrix', () => {
    const testMatrix = [
      {
        scenario: 'Level 1 Finance: Global scope',
        user: { uid: 'fin-1', role: Role.LEVEL_1_FINANCE, userType: UserType.TEACHER } as AuthenticatedUser,
        expectedFilter: { limit: 10 },
      },
      {
        scenario: 'Student Context: Enrolled events',
        user: { uid: 'stu-1', role: Role.LEVEL_3_USER, userType: UserType.STUDENT } as AuthenticatedUser,
        expectedFilter: { limit: 10, studentId: 'stu-1' },
      },
      {
        scenario: 'Level 2 Dean: Faculty boundary',
        user: { uid: 'dean-1', role: Role.LEVEL_2_DEAN, facultyId: FacultyId.FIT } as AuthenticatedUser,
        expectedFilter: { limit: 10, facultyId: FacultyId.FIT },
      },
      {
        scenario: 'Teacher / Organizer: Own organized events',
        user: { uid: 'org-1', role: Role.LEVEL_3_USER, userType: UserType.TEACHER } as AuthenticatedUser,
        expectedFilter: { limit: 10, organizerId: 'org-1' },
      },
    ];

    it.each(testMatrix)('$scenario', async ({ user, expectedFilter }) => {
      eventRepo.findWithQuery.mockResolvedValueOnce({ items: [], nextPageToken: null, totalItems: 0 });

      await service.getEventsForUser(user, { limit: 10 });

      expect(eventRepo.findWithQuery).toHaveBeenCalledWith(expectedFilter);
    });
  });

  describe('createEvent - Parent Project Validation', () => {
    const baseDto = {
      name: 'Hackathon 2026',
      facultyId: FacultyId.FIT,
      type: EventFundingType.PROJECT,
      budgetCap: 5000000,
      initialSpent: 0,
      projectId: 'PRJ-PARENT-01',
      startDate: new Date('2026-06-01').toISOString(),
      endDate: new Date('2026-06-05').toISOString(),
    };

    const mockTeacherUser = {
      ...createMockAuthenticatedUser()
    }

    it('should throw BadRequestException if parent project is not active', async () => {
      const user = { uid: 't1', role: Role.LEVEL_3_USER, userType: UserType.TEACHER } as AuthenticatedUser;
      projectRepo.findById.mockResolvedValueOnce({
        id: 'PRJ-PARENT-01',
        status: ProjectStatus.PENDING_DEAN_APPROVAL,
      } as any);

      await expect(service.createEvent(user, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sub-event timeline exceeds parent project', async () => {
      const user = { uid: 't1', role: Role.LEVEL_3_USER, userType: UserType.TEACHER } as AuthenticatedUser;
      projectRepo.findById.mockResolvedValueOnce({
        id: 'PRJ-PARENT-01',
        status: ProjectStatus.ACTIVE,
        facultyId: FacultyId.FIT,
        startDate: new Date('2026-06-02').toISOString(),
        endDate: new Date('2026-06-04').toISOString(),
        budgetCap: 20000000,
        currentSpent: 0,
      } as any);

      await expect(service.createEvent(user, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw EventOutsideParentProjectTimelineException when event dates exceed parent project bounds', async () => {
      const parentProject = createMockProjectItem({
        id: 'PRJ-FIT-001',
        facultyId: FacultyId.FIT,
        status: ProjectStatus.ACTIVE,
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T23:59:59.999Z',
        budgetCap: 50000000,
        currentSpent: 10000000,
        pendingSpent: 0,
      });

      projectRepo.findById.mockResolvedValueOnce(parentProject);

      const invalidEventDto: CreateEventDto = {
        name: 'Late Workshop',
        facultyId: FacultyId.FIT,
        type: EventFundingType.PROJECT,
        projectId: 'PRJ-FIT-001',
        budgetCap: 5000000,
        startDate: '2026-11-15T00:00:00.000Z',
        endDate: '2026-12-05T00:00:00.000Z', // Exceeds parent project endDate
      };

      await expect(service.createEvent(mockTeacherUser, invalidEventDto)).rejects.toThrow(
        EventOutsideParentProjectTimelineException
      );
    });

    it('should throw EventParentProjectRequiredException when type is PROJECT but projectId is omitted', async () => {
      const missingProjectDto: CreateEventDto = {
        name: 'Orphan Sub-Event',
        facultyId: FacultyId.FIT,
        type: EventFundingType.PROJECT,
        budgetCap: 5000000,
        startDate: '2026-11-05T00:00:00.000Z',
        endDate: '2026-11-10T00:00:00.000Z',
      };

      await expect(service.createEvent(mockTeacherUser, missingProjectDto)).rejects.toThrow(
        EventParentProjectRequiredException
      );
    });
  });

  describe('approveEvent - Organizer Constraint', () => {
    it('Organizer cannot approve their own event', async () => {
      const user = { uid: 'org-1', role: Role.LEVEL_2_DEAN, facultyId: FacultyId.FIT } as AuthenticatedUser;
      eventRepo.findById.mockResolvedValueOnce({
        id: 'EVT-1',
        organizerId: 'org-1',
        facultyId: FacultyId.FIT,
        status: EventStatus.PENDING_DEAN_APPROVAL,
        joinedStudentIds: []
      } as any);

      await expect(service.approveEvent('EVT-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});