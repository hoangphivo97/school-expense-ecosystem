import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { ProjectFundingType, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { ProjectService } from './project.service';
import { SharedService } from './shared.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepo: jest.Mocked<ProjectRepository>;
  let sharedService: SharedService;

  const mockProjectRepo = {
    findWithQuery: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    createWithFacultyFund: jest.fn(),
    transitionStatus: jest.fn(),
  };

  const mockUserRepo = {
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        SharedService,
        { provide: ProjectRepository, useValue: mockProjectRepo },
        { provide: UserRepository, useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepo = module.get(ProjectRepository);
    sharedService = module.get<SharedService>(SharedService);
    jest.clearAllMocks();
  });

  describe('getProjectsForUser - Role Scoping Matrix', () => {
    const testMatrix = [
      {
        scenario: 'Level 1 Finance: Global auditing without filters',
        user: { uid: 'u-fin', role: Role.LEVEL_1_FINANCE, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser,
        expectedFilter: { limit: 10 },
      },
      {
        scenario: 'Student Context: Enrolled projects only',
        user: { uid: 's-123', role: Role.LEVEL_3_USER, userType: UserType.STUDENT, facultyId: FacultyId.FIT } as AuthenticatedUser,
        expectedFilter: { limit: 10, studentId: 's-123' },
      },
      {
        scenario: 'Level 2 Dean: Faculty boundary enforcement',
        user: { uid: 'u-dean', role: Role.LEVEL_2_DEAN, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser,
        expectedFilter: { limit: 10, facultyId: FacultyId.FIT },
      },
      {
        scenario: 'Level 3 Teacher: Mentor isolated scope',
        user: { uid: 't-456', role: Role.LEVEL_3_USER, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser,
        expectedFilter: { limit: 10, mentorId: 't-456' },
      },
    ];

    it.each(testMatrix)('$scenario', async ({ user, expectedFilter }) => {
      projectRepo.findWithQuery.mockResolvedValueOnce({ items: [], nextPageToken: null, totalItems: 0 });

      await service.getProjectsForUser(user, { limit: 10 });

      expect(projectRepo.findWithQuery).toHaveBeenCalledWith(expectedFilter);
    });
  });

  describe('createProject - Status Routing by Role', () => {
    const baseDto = {
      name: 'AI Research Platform',
      facultyId: FacultyId.FIT,
      budgetCap: 10000000,
      initialSpent: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    it('Teacher creating SCHOOL project routes to Dean approval', async () => {
      const user = { uid: 't1', role: Role.LEVEL_3_USER, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser;
      projectRepo.create.mockImplementation(async (data) => data);

      const result = await service.createProject(user, { ...baseDto, type: ProjectFundingType.SCHOOL });
      expect(result.status).toBe(ProjectStatus.PENDING_DEAN_APPROVAL);
    });

    it('Dean creating SCHOOL project routes to Finance approval', async () => {
      const user = { uid: 'd1', role: Role.LEVEL_2_DEAN, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser;
      projectRepo.create.mockImplementation(async (data) => data);

      const result = await service.createProject(user, { ...baseDto, type: ProjectFundingType.SCHOOL });
      expect(result.status).toBe(ProjectStatus.PENDING_FINANCE_APPROVAL);
    });

    it('Finance creating SCHOOL project becomes immediately ACTIVE', async () => {
      const user = { uid: 'f1', role: Role.LEVEL_1_FINANCE, userType: UserType.TEACHER, facultyId: FacultyId.FIT } as AuthenticatedUser;
      projectRepo.create.mockImplementation(async (data) => data);

      const result = await service.createProject(user, { ...baseDto, type: ProjectFundingType.SCHOOL });
      expect(result.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('approveProject - Guard Constraints', () => {
    it('Mentor cannot approve their own project', async () => {
      const user = { uid: 't1', role: Role.LEVEL_2_DEAN, facultyId: FacultyId.FIT } as AuthenticatedUser;
      projectRepo.findById.mockResolvedValueOnce({
        id: 'PRJ-1',
        mentorId: 't1',
        facultyId: FacultyId.FIT,
        status: ProjectStatus.PENDING_DEAN_APPROVAL,
        joinedStudentIds: [],
      } as any);

      await expect(service.approveProject('PRJ-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});