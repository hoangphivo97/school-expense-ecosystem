import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as supertest from 'supertest';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import {
  EventFundingType,
  EventItem,
  EventStatus,
  PaginatedEventResult,
} from '@school-expense-ecosystem/projects/types';
import { EventController } from './event.controller';
import { EventService } from '@school-expense-ecosystem/projects/data-access-backend';
const request = require('supertest');

describe('EventController (HTTP Integration)', () => {
  let app: INestApplication;
  let mockCurrentUser: AuthenticatedUser;

  const mockEventService = {
    getEventsForUser: jest.fn(),
    createEvent: jest.fn(),
    approveEvent: jest.fn(),
    rejectEvent: jest.fn(),
  };

  beforeAll(async () => {
    mockCurrentUser = {
      uid: 'dean-user-01',
      role: Role.LEVEL_2_DEAN,
      userType: UserType.TEACHER,
      facultyId: FacultyId.FIT,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

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

  describe('GET /events (Query & Cursor Pagination)', () => {
    it('should parse query params and return 200 with paginated payload', async () => {
      const mockResult: PaginatedEventResult = {
        items: [
          {
            id: 'EVT-FIT-001',
            name: 'Cloud Computing Workshop',
            facultyId: FacultyId.FIT,
            type: EventFundingType.FACULTY,
            budgetCap: 5000000,
            initialSpent: 0,
            currentSpent: 0,
            pendingSpent: 0,
            status: EventStatus.UPCOMING,
            organizerId: 'dean-user-01',
            joinedStudentIds: [],
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        nextPageToken: 'next_token_evt',
        totalItems: 1,
      };

      mockEventService.getEventsForUser.mockResolvedValueOnce(mockResult);

      const response = await request(app.getHttpServer())
        .get('/events')
        .query({ limit: 20, status: EventStatus.UPCOMING })
        .expect(200);

      expect(mockEventService.getEventsForUser).toHaveBeenCalledWith(
        mockCurrentUser,
        expect.objectContaining({
          limit: 20,
          status: EventStatus.UPCOMING,
        })
      );
      expect(response.body).toEqual(mockResult);
    });

    it('should reject with 400 when limit is invalid', async () => {
      await request(app.getHttpServer())
        .get('/events')
        .query({ limit: -5 })
        .expect(400);

      expect(mockEventService.getEventsForUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /events (Create Event Validation)', () => {
    const validCreatePayload = {
      name: 'Hackathon 2026',
      description: 'Annual Faculty Hackathon',
      facultyId: FacultyId.FIT,
      type: EventFundingType.SCHOOL,
      budgetCap: 10000000,
      initialSpent: 0,
      startDate: new Date('2026-10-01').toISOString(),
      endDate: new Date('2026-10-03').toISOString(),
    };

    it('should create event and return 201 when payload is valid', async () => {
      const createdEvent: Partial<EventItem> = {
        id: 'EVT-FIT-999',
        ...validCreatePayload,
        status: EventStatus.PENDING_FINANCE_APPROVAL,
      };

      mockEventService.createEvent.mockResolvedValueOnce(createdEvent);

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(validCreatePayload)
        .expect(201);

      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        mockCurrentUser,
        expect.objectContaining({
          name: validCreatePayload.name,
          budgetCap: validCreatePayload.budgetCap,
        })
      );
      expect(response.body.id).toBe('EVT-FIT-999');
    });

    it('should reject with 400 when required fields are missing', async () => {
      const invalidPayload = {
        name: 'Incomplete Event',
        // Missing budgetCap, facultyId, and dates
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(invalidPayload)
        .expect(400);

      expect(mockEventService.createEvent).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /events/:id/approve', () => {
    it('should route event approval and return 200', async () => {
      const eventId = 'EVT-FIT-001';
      mockEventService.approveEvent.mockResolvedValueOnce({
        id: eventId,
        status: EventStatus.UPCOMING,
      });

      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}/approve`)
        .expect(200);

      expect(mockEventService.approveEvent).toHaveBeenCalledWith(eventId, mockCurrentUser);
      expect(response.body.status).toBe(EventStatus.UPCOMING);
    });
  });

  describe('PATCH /events/:id/reject', () => {
    it('should forward rejection reason and return 200', async () => {
      const eventId = 'EVT-FIT-001';
      const rejectDto = { reason: 'Budget cap allocation exceeded for this quarter' };

      mockEventService.rejectEvent.mockResolvedValueOnce({
        id: eventId,
        status: EventStatus.REJECTED,
      });

      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}/reject`)
        .send(rejectDto)
        .expect(200);

      expect(mockEventService.rejectEvent).toHaveBeenCalledWith(
        eventId,
        mockCurrentUser,
        expect.objectContaining(rejectDto)
      );
      expect(response.body.status).toBe(EventStatus.REJECTED);
    });
  });
});