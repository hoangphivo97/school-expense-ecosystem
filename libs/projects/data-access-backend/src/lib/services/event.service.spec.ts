import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import { EventRepository } from '../repositories/abstracts/event.repository';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { EventService } from './event.service';
import { SharedService } from './shared.service';

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
        SharedService,
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
      type: EventFundingType.SCHOOL,
      budgetCap: 5000000,
      initialSpent: 0,
      projectId: 'PRJ-PARENT-01',
      startDate: new Date('2026-06-01').toISOString(),
      endDate: new Date('2026-06-05').toISOString(),
    };

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