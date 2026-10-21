import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { EventRepository } from '../repositories/abstracts/event.repository';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import {
  EventItem,
  EventFundingType,
  EventStatus,
  JoinConfig,
  ProjectStatus,
  StudentSummary,
  PaginatedEventResult,
  EventQueryPayload,
  EnrolledActivitySummary,
  CreateEventPayload,
  UpdateEventPayload,
  GenerateJoinCodePayload,
  JoinByCodePayload,
  RejectEventPayload,
  AddParticipantsPayload,
} from '@school-expense-ecosystem/projects/types';
import {
  EventActiveFinancialModificationException,
  EventApprovalForbiddenException,
  EventForbiddenException,
  EventInitialSpentExceedsCapException,
  EventNotFoundException,
  EventOutsideParentProjectTimelineException,
  EventParentProjectRequiredException,
  EventPendingExpensesArchiveException,
  EventStudentNotEnrolledException,
  InvalidEventStateException,
} from '../exceptions/event.exception';
import { JoinCodeService } from './join-code.service';
import { InvalidJoinCodeException } from '../exceptions/join-code.exception';
import { toEnrolledActivitySummary, toStudentSummaryList } from '../mapper/activity.mapper';
import { calculateSpannedYears } from '../helpers/calculate-years.helper';
import { ProjectStudentNotFoundException } from '../exceptions/project.exception';
import { UserRepository } from '@school-expense-ecosystem/admin/data-access-backend';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
    private readonly joinCodeService: JoinCodeService
  ) { }

  /**
   * Create an event supporting both Standalone and Sub-event (Project-linked) models
   */
  async createEvent(user: AuthenticatedUser, payload: CreateEventPayload): Promise<EventItem> {
    const facultyPrefix = payload.facultyId.toUpperCase();
    const shortHash = randomBytes(3).toString('hex').toUpperCase();
    const eventId = `EVT-${facultyPrefix}-${shortHash}`;

    const initialSpent = payload.initialSpent ?? 0;
    if (initialSpent > payload.budgetCap) {
      throw new EventInitialSpentExceedsCapException();
    }

    let initialStatus: EventStatus;

    // 1. Case A: Sub-event linked to a Parent Project
    if (payload.type === EventFundingType.PROJECT) {
      if (!payload.projectId) {
        throw new EventParentProjectRequiredException();
      }

      const parentProject = await this.projectRepository.findById(payload.projectId);
      if (!parentProject) {
        throw new NotFoundException(`Parent Project with ID ${payload.projectId} not found.`);
      }

      if (parentProject.status !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot attach an event to an inactive project.');
      }

      if (parentProject.facultyId !== payload.facultyId) {
        throw new BadRequestException('EventItem faculty must match parent project faculty.');
      }

      // Normalize date boundaries: start of day for start date, end of day for end date
      const eventStart = new Date(payload.startDate).setHours(0, 0, 0, 0);
      const eventEnd = new Date(payload.endDate).setHours(23, 59, 59, 999);
      const projectStart = new Date(parentProject.startDate).setHours(0, 0, 0, 0);
      const projectEnd = new Date(parentProject.endDate).setHours(23, 59, 59, 999);

      if (eventStart < projectStart || eventEnd > projectEnd) {
        throw new EventOutsideParentProjectTimelineException(
          payload.startDate,
          payload.endDate,
          parentProject.startDate,
          parentProject.endDate
        );
      }

      const availableBudget =
        parentProject.budgetCap - (parentProject.currentSpent + (parentProject.pendingSpent ?? 0));
      if (payload.budgetCap > availableBudget) {
        throw new BadRequestException(
          `EventItem budget cap exceeds available project budget headroom (${availableBudget}).`
        );
      }

      // Reserve project budget headroom via pendingSpent delta
      await this.projectRepository.updateSpentCounters(payload.projectId, {
        pendingSpentDelta: payload.budgetCap,
      });

      const isDeanOrFinance = user.role === Role.LEVEL_2_DEAN || user.role === Role.LEVEL_1_FINANCE;
      initialStatus = isDeanOrFinance ? EventStatus.UPCOMING : EventStatus.PENDING_DEAN_APPROVAL;
    } else {
      // 2. Case B: Standalone Event (Routes through governance workflow)
      const isFinance = user.role === Role.LEVEL_1_FINANCE;
      const isDean = user.role === Role.LEVEL_2_DEAN;

      if (payload.type === EventFundingType.OUTSOURCE || isFinance) {
        initialStatus = EventStatus.UPCOMING;
      } else if (isDean) {
        // Dean creating a School-funded event routes to Finance; Faculty-funded activates directly
        initialStatus = payload.type === EventFundingType.SCHOOL
          ? EventStatus.PENDING_FINANCE_APPROVAL
          : EventStatus.UPCOMING;
      } else {
        // Teachers creating Faculty or School events must route to Dean first
        initialStatus = EventStatus.PENDING_DEAN_APPROVAL;
      }
    }

    const joinConfig = payload.joinCodeConfig
      ? this.joinCodeService.generateInlineConfig(payload.joinCodeConfig, payload.startDate, payload.endDate)
      : null;

    const newEvent: EventItem = {
      id: eventId,
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : undefined,
      projectId: payload.projectId ?? null,
      facultyId: payload.facultyId,
      type: payload.type,
      budgetCap: payload.budgetCap,
      initialSpent: initialSpent,
      currentSpent: initialSpent,
      pendingSpent: 0,
      status: initialStatus,
      organizerId: user.uid,
      joinedStudentIds: [],
      joinConfig: joinConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: new Date(payload.startDate).toISOString(),
      endDate: new Date(payload.endDate).toISOString(),
      years: calculateSpannedYears(payload.startDate, payload.endDate),
    };

    // Encumber faculty fund if it is a standalone faculty-funded event
    if (!payload.projectId && payload.type === EventFundingType.FACULTY) {
      const currentYear = new Date().getFullYear();
      const departmentFundId = `${payload.facultyId.toUpperCase()}_DEPT_${currentYear}`;
      return this.eventRepository.createWithFacultyFund(newEvent, departmentFundId);
    }

    return this.eventRepository.create(newEvent);
  }

  /**
   * Update event details with financial baseline locks
   */
  async updateEvent(id: string, user: AuthenticatedUser, payload: UpdateEventPayload): Promise<EventItem> {
    const event = await this.validateEventAccess(id, user);

    // 1. Guard editable lifecycle statuses
    const editableStatuses = [
      EventStatus.PENDING_DEAN_APPROVAL,
      EventStatus.PENDING_FINANCE_APPROVAL,
      EventStatus.UPCOMING,
    ];
    if (!editableStatuses.includes(event.status)) {
      throw new InvalidEventStateException('modify', event.status);
    }

    // Prohibit direct modifications to financial baselines on active/upcoming events
    if (event.status === EventStatus.UPCOMING || event.status === EventStatus.ONGOING) {
      if (payload.initialSpent !== undefined && payload.initialSpent !== event.initialSpent) {
        throw new EventActiveFinancialModificationException('initialSpent');
      }
      if (payload.budgetCap !== undefined && payload.budgetCap !== event.budgetCap) {
        throw new EventActiveFinancialModificationException('budgetCap');
      }
    }

    const isFinanceOrAdmin = user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_0_ADMIN;
    const isDean = user.role === Role.LEVEL_2_DEAN;

    // 2. Determine target status: Trigger re-approval if modifying an UPCOMING event
    let nextStatus = event.status;
    if (event.status === EventStatus.UPCOMING && !isFinanceOrAdmin) {
      if (event.type === EventFundingType.SCHOOL) {
        nextStatus = isDean ? EventStatus.PENDING_FINANCE_APPROVAL : EventStatus.PENDING_DEAN_APPROVAL;
      }
    }

    const newInitialSpent = payload.initialSpent !== undefined ? Number(payload.initialSpent) : event.initialSpent;
    const targetBudgetCap = payload.budgetCap !== undefined ? Number(payload.budgetCap) : event.budgetCap;

    if (newInitialSpent > targetBudgetCap) {
      throw new EventInitialSpentExceedsCapException();
    }

    const { expectedUpdatedAt, ...cleanpayload } = payload;

    const targetStartDate = cleanpayload.startDate ?? event.startDate;
    const targetEndDate = cleanpayload.endDate ?? event.endDate;
    const isTimelineModified = Boolean(cleanpayload.startDate || cleanpayload.endDate);

    if (isTimelineModified && event.type === EventFundingType.PROJECT && event.projectId) {
      const parentProject = await this.projectRepository.findById(event.projectId);
      if (parentProject) {
        const eventStart = new Date(targetStartDate).setHours(0, 0, 0, 0);
        const eventEnd = new Date(targetEndDate).setHours(23, 59, 59, 999);
        const projectStart = new Date(parentProject.startDate).setHours(0, 0, 0, 0);
        const projectEnd = new Date(parentProject.endDate).setHours(23, 59, 59, 999);

        if (eventStart < projectStart || eventEnd > projectEnd) {
          throw new EventOutsideParentProjectTimelineException(
            targetStartDate,
            targetEndDate,
            parentProject.startDate,
            parentProject.endDate
          );
        }
      }
    }

    const updateData: Partial<EventItem> = {
      ...(cleanpayload.name && { name: cleanpayload.name.trim() }),
      ...(cleanpayload.description !== undefined && { description: cleanpayload.description ? cleanpayload.description.trim() : undefined }),
      ...(cleanpayload.type && { type: cleanpayload.type }),
      ...(cleanpayload.facultyId && { facultyId: cleanpayload.facultyId }),
      ...(cleanpayload.budgetCap !== undefined && { budgetCap: targetBudgetCap }),
      ...(cleanpayload.initialSpent !== undefined && {
        initialSpent: newInitialSpent,
        currentSpent: newInitialSpent,
      }),
      ...(cleanpayload.startDate && { startDate: new Date(cleanpayload.startDate).toISOString() }),
      ...(cleanpayload.endDate && { endDate: new Date(cleanpayload.endDate).toISOString() }),
      ...(isTimelineModified && {
        years: calculateSpannedYears(targetStartDate, targetEndDate),
      }),
      status: nextStatus,
    };

    // 3. Commit update atomically with Optimistic Locking check
    return this.eventRepository.updateWithOptimisticLock(id, updateData, expectedUpdatedAt);
  }

  /**
   * Scoped EventItem Query based on user role and permissions
   */
  async getEventsForUser(
    user: AuthenticatedUser,
    query?: EventQueryPayload
  ): Promise<PaginatedEventResult> {
    const baseQuery: EventQueryPayload = {
      ...query,
      limit: query?.limit ?? 10,
    };

    // 1. Finance Audit Scope (Global access)
    if (user.role === Role.LEVEL_1_FINANCE) {
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
    payload: GenerateJoinCodePayload
  ): Promise<JoinConfig> {
    const event = await this.validateEventAccess(id, user);

    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new InvalidEventStateException('generate join code', event.status);
    }

    this.joinCodeService.validateJoinCodeSchedule(payload, event.endDate);

    const joinConfig = this.joinCodeService.generateConfig(payload);
    await this.eventRepository.updateJoinConfig(id, joinConfig);
    return joinConfig;
  }

  /**
   * Student self-registration via code
   */
  async joinEventByCode(user: AuthenticatedUser, payload: JoinByCodePayload): Promise<EnrolledActivitySummary> {
    const event = await this.eventRepository.findByJoinCode(payload.code);
    if (!event) {
      throw new InvalidJoinCodeException();
    }

    if (event.type === EventFundingType.FACULTY && user.facultyId !== event.facultyId) {
      throw new ForbiddenException('Faculty-funded events only accept students from the same department.');
    }

    const enrolled = await this.eventRepository.enrollStudentViaCode(
      event.id,
      user.uid,
      payload.code,
      [EventStatus.ONGOING, EventStatus.UPCOMING]
    );

    return toEnrolledActivitySummary(enrolled);
  }

  /**
   * Multi-level approval workflow for standalone events
   */
  async approveEvent(id: string, user: AuthenticatedUser): Promise<EventItem> {
    const event = await this.validateEventAccess(id, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && event.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    if (event.organizerId === user.uid) {
      throw new ForbiddenException('You cannot approve an event proposal where you are the organizer.');
    }

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

    return this.eventRepository.transitionStatus(
      id,
      nextStatus,
      [event.status],
      {
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Reject or cancel event with required reason
   */
  async rejectEvent(id: string, user: AuthenticatedUser, payload: RejectEventPayload): Promise<EventItem> {
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

    return this.eventRepository.transitionStatus(
      id,
      EventStatus.REJECTED,
      [EventStatus.PENDING_DEAN_APPROVAL, EventStatus.PENDING_FINANCE_APPROVAL, EventStatus.UPCOMING],
      {
        rejectionReason: payload.reason.trim(),
        rejectedBy: user.uid,
      }
    );
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

    return toStudentSummaryList(users);
  }

  async addStudentsManually(id: string, user: AuthenticatedUser, payload: AddParticipantsPayload): Promise<void> {
    const event = await this.validateEventAccess(id, user);

    if (event.status === EventStatus.PENDING_DEAN_APPROVAL) {
      throw new InvalidEventStateException('modify roster during', event.status);
    }

    const requestedIds = [...new Set(payload.userIds)];
    if (requestedIds.length === 0) return;

    // Verify system accounts exist
    const existingUsers = await this.userRepository.findByIds(requestedIds);
    const foundUserMap = new Map(existingUsers.map((u) => [u.uid, u]));

    const missingIds = requestedIds.filter((id) => !foundUserMap.has(id));
    if (missingIds.length > 0) {
      throw new ProjectStudentNotFoundException(missingIds);
    }

    // Restrict additions strictly to students
    const nonStudentAccounts = existingUsers.filter((u) => u.userType !== UserType.STUDENT);
    if (nonStudentAccounts.length > 0) {
      const invalidEmails = nonStudentAccounts.map((u) => u.email || `${u.fullName} (${u.uid})`);
      throw new BadRequestException(`Cannot assign non-student accounts to roster: ${invalidEmails.join(', ')}`);
    }

    // Filter out already enrolled members
    const currentEnrolledSet = new Set(event.joinedStudentIds ?? []);
    const studentsToAdd = requestedIds.filter((uid) => !currentEnrolledSet.has(uid));

    if (studentsToAdd.length === 0) return;

    await this.eventRepository.addStudentsBulk(id, studentsToAdd);
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

    const isFinance = user.role === Role.LEVEL_1_FINANCE;
    const isOrganizer = event.organizerId === user.uid;
    const isEnrolledStudent = event.joinedStudentIds.includes(user.uid);
    const isFacultyDean =
      user.role === Role.LEVEL_2_DEAN && event.facultyId === user.facultyId;

    if (!isFinance && !isOrganizer && !isEnrolledStudent && !isFacultyDean) {
      throw new EventForbiddenException();
    }

    return event;
  }
}