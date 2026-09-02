import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import {
  AddParticipantsDto,
  CreateEventDto,
  EventQueryDto,
  GenerateJoinCodeDto,
  JoinByCodeDto,
  RejectEventDto,
  UpdateEventDto,
} from '@school-expense-ecosystem/projects/features-backend';
import { EventRepository } from '../repositories/abstracts/event.repository';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import {
  EventItem,
  EventFundingType,
  EventStatus,
  JoinConfig,
  ProjectStatus,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';
import {
  EventActiveFinancialModificationException,
  EventApprovalForbiddenException,
  EventForbiddenException,
  EventInitialSpentExceedsCapException,
  EventNotFoundException,
  EventPendingExpensesArchiveException,
  EventStudentNotEnrolledException,
  InvalidEventStateException,
} from '../exceptions/event.exception';
import { SharedService } from './shared.service';
import { InvalidJoinCodeException } from '../exceptions/join-code.exception';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
    private readonly sharedService: SharedService
  ) {}

  /**
   * Create an event supporting both Standalone and Sub-event (Project-linked) models
   */
  async createEvent(user: AuthenticatedUser, dto: CreateEventDto): Promise<EventItem> {
    const facultyPrefix = dto.facultyId.toUpperCase();
    const shortHash = randomBytes(3).toString('hex').toUpperCase();
    const eventId = `EVT-${facultyPrefix}-${shortHash}`;

    const initialSpent = dto.initialSpent ?? 0;
    if (initialSpent > dto.budgetCap) {
      throw new EventInitialSpentExceedsCapException();
    }

    let initialStatus: EventStatus;

    // 1. Case A: Sub-event linked to a Parent Project
    if (dto.projectId) {
      const parentProject = await this.projectRepository.findById(dto.projectId);
      if (!parentProject) {
        throw new NotFoundException(`Parent Project with ID ${dto.projectId} not found.`);
      }

      if (parentProject.status !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot attach an event to an inactive project.');
      }

      if (parentProject.facultyId !== dto.facultyId) {
        throw new BadRequestException('EventItem faculty must match parent project faculty.');
      }

      const eventStart = new Date(dto.startDate);
      const eventEnd = new Date(dto.endDate);
      const projectStart = new Date(parentProject.startDate);
      const projectEnd = new Date(parentProject.endDate);

      if (eventStart < projectStart || eventEnd > projectEnd) {
        throw new BadRequestException('EventItem timeline must stay within the parent project duration.');
      }

      const availableBudget =
        parentProject.budgetCap - (parentProject.currentSpent + parentProject.pendingSpent);
      if (dto.budgetCap > availableBudget) {
        throw new BadRequestException(
          `EventItem budget cap exceeds available project budget headroom (${availableBudget}).`
        );
      }

      // Sub-events under active projects are immediately upcoming
      initialStatus = EventStatus.UPCOMING;

      // Reserve project budget headroom via pendingSpent delta
      await this.projectRepository.updateSpentCounters(dto.projectId, {
        pendingSpentDelta: dto.budgetCap,
      });
    } else {
      // 2. Case B: Standalone EventItem (Routes through approval workflow)
      const isSchoolFunded = dto.type === EventFundingType.SCHOOL;
      const isFinance = user.role === Role.LEVEL_1_FINANCE;
      const isDean = user.role === Role.LEVEL_2_DEAN;

      if (!isSchoolFunded || isFinance) {
        initialStatus = EventStatus.UPCOMING;
      } else if (isDean) {
        initialStatus = EventStatus.PENDING_FINANCE_APPROVAL;
      } else {
        initialStatus = EventStatus.PENDING_DEAN_APPROVAL;
      }
    }

    const newEvent: EventItem = {
      id: eventId,
      name: dto.name.trim(),
      description: dto.description ? dto.description.trim() : undefined,
      projectId: dto.projectId ?? null,
      facultyId: dto.facultyId,
      type: dto.type,
      budgetCap: dto.budgetCap,
      initialSpent: initialSpent,
      currentSpent: initialSpent,
      pendingSpent: 0,
      status: initialStatus,
      organizerId: user.uid,
      joinedStudentIds: [],
      joinConfig: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: new Date(dto.startDate).toISOString(),
      endDate: new Date(dto.endDate).toISOString(),
    };

    // Encumber faculty fund if it is a standalone faculty-funded event
    if (!dto.projectId && dto.type === EventFundingType.FACULTY) {
      const currentYear = new Date().getFullYear();
      const departmentFundId = `${dto.facultyId.toUpperCase()}_DEPT_${currentYear}`;
      return this.eventRepository.createWithFacultyFund(newEvent, departmentFundId);
    }

    return this.eventRepository.create(newEvent);
  }

  /**
   * Update event details with financial baseline locks
   */
  async updateEvent(id: string, user: AuthenticatedUser, dto: UpdateEventDto): Promise<EventItem> {
    const event = await this.validateEventAccess(id, user);

    if (
      event.status === EventStatus.ARCHIVED ||
      event.status === EventStatus.COMPLETED ||
      event.status === EventStatus.CANCELLED
    ) {
      throw new InvalidEventStateException('modify', event.status);
    }

    // Prohibit direct modifications to financial baselines on active/upcoming events
    if (event.status === EventStatus.UPCOMING || event.status === EventStatus.ONGOING) {
      if (dto.initialSpent !== undefined && dto.initialSpent !== event.initialSpent) {
        throw new EventActiveFinancialModificationException('initialSpent');
      }
      if (dto.budgetCap !== undefined && dto.budgetCap !== event.budgetCap) {
        throw new EventActiveFinancialModificationException('budgetCap');
      }
    }

    const isDeanOrFinance = user.role === Role.LEVEL_2_DEAN || user.role === Role.LEVEL_1_FINANCE;
    const isExtendingSchoolEvent =
      event.type === EventFundingType.SCHOOL &&
      dto.endDate &&
      new Date(dto.endDate) > new Date(event.endDate);

    const nextStatus =
      !isDeanOrFinance && isExtendingSchoolEvent
        ? EventStatus.PENDING_DEAN_APPROVAL
        : event.status;

    const newInitialSpent = dto.initialSpent !== undefined ? Number(dto.initialSpent) : event.initialSpent;
    const targetBudgetCap = dto.budgetCap !== undefined ? Number(dto.budgetCap) : event.budgetCap;

    if (newInitialSpent > targetBudgetCap) {
      throw new EventInitialSpentExceedsCapException();
    }

    const updateData: Partial<EventItem> = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.description !== undefined && { description: dto.description ? dto.description.trim() : undefined }),
      ...(dto.type && { type: dto.type }),
      ...(dto.facultyId && { facultyId: dto.facultyId }),
      ...(dto.budgetCap !== undefined && { budgetCap: targetBudgetCap }),
      ...(dto.initialSpent !== undefined && {
        initialSpent: newInitialSpent,
        currentSpent: newInitialSpent,
      }),
      ...(dto.startDate && { startDate: new Date(dto.startDate).toISOString() }),
      ...(dto.endDate && { endDate: new Date(dto.endDate).toISOString() }),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, updateData);
    return { ...event, ...updateData };
  }

  /**
   * Scoped EventItem Query based on user role and permissions
   */
  async getEventsForUser(
    user: AuthenticatedUser,
    query?: EventQueryDto
  ): Promise<{ items: EventItem[]; total: number }> {
    const baseQuery = query ?? {};

    // 1. Finance Audit Scope (Global access)
    if (user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_0_ADMIN) {
      return this.eventRepository.findWithQuery(baseQuery);
    }

    // 2. Student Scope (Enrolled events)
    if (user.userType === UserType.STUDENT) {
      return this.eventRepository.findWithQuery({ ...baseQuery, studentId: user.uid });
    }

    // 3. Dean Scope (Faculty boundary)
    if (user.role === Role.LEVEL_2_DEAN) {
      return this.eventRepository.findWithQuery({ ...baseQuery, facultyId: user.facultyId });
    }

    // 4. Teacher / Organizer Scope (Organized events)
    return this.eventRepository.findWithQuery({ ...baseQuery, organizerId: user.uid });
  }

  async getEventById(id: string, user: AuthenticatedUser): Promise<EventItem> {
    return this.validateEventAccess(id, user);
  }

  /**
   * Generate or update invitation code for an event
   */
  async generateJoinCode(
    id: string,
    user: AuthenticatedUser,
    dto: GenerateJoinCodeDto
  ): Promise<JoinConfig> {
    const event = await this.validateEventAccess(id, user);

    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new InvalidEventStateException('generate join code', event.status);
    }

    this.sharedService.validateJoinCodeSchedule(dto, event.endDate);

    const joinConfig = this.sharedService.generateConfig(dto);
    await this.eventRepository.updateJoinConfig(id, joinConfig);
    return joinConfig;
  }

  /**
   * Student self-registration via code
   */
  async joinEventByCode(user: AuthenticatedUser, joinDto: JoinByCodeDto): Promise<EventItem> {
    const event = await this.eventRepository.findByJoinCode(joinDto.code);
    if (!event) {
      throw new InvalidJoinCodeException();
    }

    if (event.status !== EventStatus.UPCOMING && event.status !== EventStatus.ONGOING) {
      throw new InvalidEventStateException('join event', event.status);
    }

    return this.eventRepository.enrollStudentViaCode(event.id, user.uid);
  }

  /**
   * Multi-level approval workflow for standalone events
   */
  async approveEvent(id: string, user: AuthenticatedUser): Promise<EventItem> {
    const event = await this.validateEventAccess(id, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && event.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    let nextStatus: EventStatus;

    if (event.status === EventStatus.PENDING_DEAN_APPROVAL) {
      if (!isFacultyDean) throw new EventApprovalForbiddenException();
      nextStatus =
        event.type === EventFundingType.SCHOOL
          ? EventStatus.PENDING_FINANCE_APPROVAL
          : EventStatus.UPCOMING;
    } else if (event.status === EventStatus.PENDING_FINANCE_APPROVAL) {
      if (!isFinance) throw new EventApprovalForbiddenException();
      nextStatus = EventStatus.UPCOMING;
    } else {
      throw new InvalidEventStateException('approve', event.status);
    }

    const updateData: Partial<EventItem> = {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, updateData);
    return { ...event, ...updateData };
  }

  /**
   * Reject or cancel event with required reason
   */
  async rejectEvent(id: string, user: AuthenticatedUser, dto: RejectEventDto): Promise<EventItem> {
    const event = await this.validateEventAccess(id, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && event.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;
    const isOrganizer = event.organizerId === user.uid;

    if (!isFacultyDean && !isFinance && !isOrganizer) {
      throw new EventApprovalForbiddenException();
    }

    // Release encumbered parent project budget if sub-event is rejected/cancelled
    if (event.projectId) {
      await this.projectRepository.updateSpentCounters(event.projectId, {
        pendingSpentDelta: -event.budgetCap,
      });
    }

    const updateData: Partial<EventItem> = {
      status: EventStatus.REJECTED,
      rejectionReason: dto.reason.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, updateData);
    return { ...event, ...updateData };
  }

  /**
   * Soft archive event
   */
  async archiveEvent(id: string, user: AuthenticatedUser): Promise<void> {
    const event = await this.validateEventAccess(id, user);

    if (event.status === EventStatus.ARCHIVED) {
      throw new InvalidEventStateException('archive', event.status);
    }

    if ((event.pendingSpent ?? 0) > 0) {
      throw new EventPendingExpensesArchiveException();
    }

    await this.eventRepository.update(id, { status: EventStatus.ARCHIVED });
  }

  /**
   * Enriched student roster query
   */
  async getEventStudents(id: string, user: AuthenticatedUser): Promise<StudentSummary[]> {
    const event = await this.validateEventAccess(id, user);
    const studentIds = event.joinedStudentIds ?? [];
    if (studentIds.length === 0) return [];

    const users = await this.userRepository.findByIds(studentIds);

    return users.map((u) => ({
      id: u.uid || (u as any).id,
      studentCode: String(u.userCode || '').trim(),
      fullName: String(u.fullName || '').trim(),
      email: String(u.email || '').trim(),
    }));
  }

  async addStudentsManually(id: string, user: AuthenticatedUser, dto: AddParticipantsDto): Promise<void> {
    const event = await this.validateEventAccess(id, user);

    if (event.status === EventStatus.PENDING_DEAN_APPROVAL) {
      throw new InvalidEventStateException('modify roster during', event.status);
    }

    await this.eventRepository.addStudentsBulk(id, dto.userIds);
  }

  async removeStudent(id: string, studentUid: string, user: AuthenticatedUser): Promise<void> {
    const event = await this.validateEventAccess(id, user);

    if (!event.joinedStudentIds.includes(studentUid)) {
      throw new EventStudentNotEnrolledException(studentUid);
    }

    await this.eventRepository.removeStudent(id, studentUid);
  }

  async searchStudents(query: string): Promise<StudentSummary[]> {
    const trimmed = query?.trim() ?? '';
    if (trimmed.length < 2) return [];
    return this.eventRepository.searchStudents(trimmed);
  }

  /**
   * Fine-grained Access Control Validation
   */
  private async validateEventAccess(id: string, user: AuthenticatedUser): Promise<EventItem> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new EventNotFoundException(id);
    }

    const isGlobalAuditor =
      user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_0_ADMIN;
    const isOrganizer = event.organizerId === user.uid;
    const isEnrolledStudent = event.joinedStudentIds.includes(user.uid);
    const isFacultyDean =
      user.role === Role.LEVEL_2_DEAN && event.facultyId === user.facultyId;

    if (!isGlobalAuditor && !isOrganizer && !isEnrolledStudent && !isFacultyDean) {
      throw new EventForbiddenException();
    }

    return event;
  }
}