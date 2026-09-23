import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as supertest from 'supertest';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { EnrolledActivitySummary, PaginatedProjectResult, ProjectFundingType, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { ProjectController } from './project.controller';
import { ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { AuthGuard } from '@nestjs/passport';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';
const request = require('supertest');

describe('ProjectController (HTTP Integration)', () => {
  let app: INestApplication;
  let mockCurrentUser: AuthenticatedUser;

  const mockProjectService = {
    getProjectsForUser: jest.fn(),
    approveProject: jest.fn(),
    joinProjectByCode: jest.fn(),
  };

  beforeAll(async () => {
    // Default user context for authenticated requests
    mockCurrentUser = createMockAuthenticatedUser({
      uid: 'dean-user-01',
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    })
      // If your controller uses an AuthGuard, simulate injecting user into request
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = mockCurrentUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();

    // Attach global validation pipe identical to main.ts configuration
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

    // Mock Express middleware to inject current user into request context
    app.use((req: any, _res: any, next: () => void) => {
      req.user = mockCurrentUser;
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /projects (Query & Validation)', () => {
    it('should parse query parameters and return 200 with paginated result', async () => {
      const mockResult: PaginatedProjectResult = {
        items: [
          {
            id: 'PRJ-FIT-001',
            name: 'AI Capstone',
            type: ProjectFundingType.FACULTY,
            status: ProjectStatus.ACTIVE,
            budgetCap: 15000000,
            initialSpent: 0,
            currentSpent: 0,
            mentorId: 'dean-user-01',
            facultyId: FacultyId.FIT,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            joinedStudentIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        nextPageToken: 'token_page_2',
        totalItems: 1,
      };

      mockProjectService.getProjectsForUser.mockResolvedValueOnce(mockResult);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .query({ limit: 15, status: ProjectStatus.ACTIVE })
        .expect(200);

      // Verify Service receives transformed numeric limit and enum status
      expect(mockProjectService.getProjectsForUser).toHaveBeenCalledWith(
        mockCurrentUser,
        expect.objectContaining({
          limit: 15,
          status: ProjectStatus.ACTIVE,
        })
      );

      expect(response.body).toEqual(mockResult);
    });

    it('should reject with 400 when limit exceeds allowed maximum', async () => {
      // BaseActivityQueryDto limits max value to 100
      const response = await request(app.getHttpServer())
        .get('/projects')
        .query({ limit: 150 })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('limit must not be greater than 100')])
      );
      expect(mockProjectService.getProjectsForUser).not.toHaveBeenCalled();
    });

    it('should reject with 400 when status is not a valid ProjectStatus enum', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .query({ status: 'NOT_EXISTING_STATUS' })
        .expect(400);

      expect(mockProjectService.getProjectsForUser).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /projects/:id/approve', () => {
    it('should forward approval route params and return 200', async () => {
      const targetProjectId = 'PRJ-FIT-001';
      mockProjectService.approveProject.mockResolvedValueOnce({
        id: targetProjectId,
        status: ProjectStatus.ACTIVE,
      });

      const response = await request(app.getHttpServer())
        .patch(`/projects/${targetProjectId}/approve`)
        .expect(200);

      expect(mockProjectService.approveProject).toHaveBeenCalledWith(targetProjectId, mockCurrentUser);
      expect(response.body.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('POST /projects/join (Student Enrollment via Code)', () => {
    beforeEach(() => {
      // Re-assign request context with Student credentials
      mockCurrentUser = createMockAuthenticatedUser({
        uid: 'student-user-01',
        userCode: 'STU_FIT_01',
        role: Role.LEVEL_3_USER,
        userType: UserType.STUDENT,
      });
    });

    afterEach(() => {
      // Restore default Dean context
      mockCurrentUser = createMockAuthenticatedUser({
        uid: 'dean-user-01',
      });
    });

    it('should enroll student and return 200 with sanitized summary', async () => {
      const mockSummary: EnrolledActivitySummary = {
        id: 'PRJ-FIT-001',
        name: 'AI Capstone',
        description: 'Capstone project',
        type: ProjectFundingType.FACULTY,
        status: ProjectStatus.ACTIVE,
        facultyId: FacultyId.FIT,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        joinedStudentIds: ['dean-user-01'],
        updatedAt: new Date().toISOString(),
      };

      mockProjectService.joinProjectByCode.mockResolvedValueOnce(mockSummary);

      const response = await request(app.getHttpServer())
        .post('/projects/join')
        .send({ code: 'PRJ-9821' })
        .expect(200);

      expect(mockProjectService.joinProjectByCode).toHaveBeenCalledWith(
        mockCurrentUser,
        expect.objectContaining({ code: 'PRJ-9821' })
      );
      expect(response.body).toEqual(mockSummary);
      // Ensure sensitive internal financial baselines are not leaked to student
      expect(response.body.budgetCap).toBeUndefined();
      expect(response.body.currentSpent).toBeUndefined();
    });

    it('should trim and uppercase code via Transform pipe', async () => {
      mockProjectService.joinProjectByCode.mockResolvedValueOnce({ id: 'PRJ-FIT-001' });

      await request(app.getHttpServer())
        .post('/projects/join')
        .send({ code: '  prj-9821  ' })
        .expect(200);

      expect(mockProjectService.joinProjectByCode).toHaveBeenCalledWith(
        mockCurrentUser,
        expect.objectContaining({ code: 'PRJ-9821' })
      );
    });

    it('should reject with 400 when code is shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .post('/projects/join')
        .send({ code: 'SHORT' })
        .expect(400);

      expect(mockProjectService.joinProjectByCode).not.toHaveBeenCalled();
    });
  });
});
