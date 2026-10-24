import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { JoinConfig, ProjectItem, ProjectFundingType, ProjectStatus, StudentSummary, ProjectQueryPayload, PaginatedProjectResult, EnrolledActivitySummary, UpdateProjectPayload, CreateProjectPayload, JoinByCodePayload, AddParticipantsPayload, GenerateJoinCodePayload, RejectProjectPayload } from '@school-expense-ecosystem/projects/types';
import { ProjectActiveFinancialModificationException, ProjectAlreadyArchivedException, ProjectApprovalForbiddenException, ProjectInitialSpentExceedsCapException, ProjectInvalidStatusTransitionException, ProjectPendingExpensesArchiveException, ProjectRosterLockedException, ProjectStudentNotEnrolledException, ProjectStudentNotFoundException } from '../exceptions/project.exception';
import { JoinCodeService } from './join-code.service';
import { InvalidJoinCodeException } from '../exceptions/join-code.exception';
import { toEnrolledActivitySummary, toStudentSummaryList } from '../mapper/activity.mapper';
import { calculateSpannedYears } from '../helpers/calculate-years.helper';
import { UserRepository } from '@school-expense-ecosystem/admin/data-access-backend';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly userRepo: UserRepository,
    private readonly joinCodeService: JoinCodeService
  ) { }

  async createProject(user: AuthenticatedUser, payload: CreateProjectPayload): Promise<ProjectItem> {
    const isSchoolFunded = payload.type === ProjectFundingType.SCHOOL;
    const isOutsrouce = payload.type === ProjectFundingType.OUTSOURCE;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;
    const isDean = user.role === Role.LEVEL_2_DEAN;

    let initialStatus: ProjectStatus;

    if (isOutsrouce || isFinance) {
      initialStatus = ProjectStatus.ACTIVE;
    } else if (isDean) {
      // Deans possess authority over Faculty funds; School-funded projects escalate to Finance
      initialStatus = isSchoolFunded
        ? ProjectStatus.PENDING_FINANCE_APPROVAL
        : ProjectStatus.ACTIVE;
    } else {
      // Teachers creating Faculty or School projects must first route to Dean approval
      initialStatus = ProjectStatus.PENDING_DEAN_APPROVAL;
    }

    const facultyPrefix = payload.facultyId.toUpperCase();
    const shortHash = randomBytes(3).toString('hex').toUpperCase();
    const projectId = `PRJ-${facultyPrefix}-${shortHash}`;

    const initialSpent = payload.initialSpent ?? 0;
    if (initialSpent > payload.budgetCap) {
      throw new ProjectInitialSpentExceedsCapException();
    }

    const joinConfig = payload.joinCodeConfig
      ? this.joinCodeService.generateInlineConfig(payload.joinCodeConfig, payload.startDate, payload.endDate)
      : null;

    const newProject: ProjectItem = {
      id: projectId,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      budgetCap: payload.budgetCap,
      initialSpent: initialSpent,
      currentSpent: initialSpent,
      pendingSpent: 0,
      status: initialStatus,
      mentorId: payload.mentorId ?? user.uid,
      facultyId: payload.facultyId,
      startDate: new Date(payload.startDate).toISOString(),
      endDate: new Date(payload.endDate).toISOString(),
      joinedStudentIds: [],
      joinConfig: joinConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      years: calculateSpannedYears(payload.startDate, payload.endDate)
    };

    if (payload.type === ProjectFundingType.FACULTY) {
      const currentYear = new Date().getFullYear();
      const departmentFundId = `${payload.facultyId.toUpperCase()}_DEPT_${currentYear}`;
      return this.projectRepo.createWithFacultyFund(newProject, departmentFundId);
    }

    return this.projectRepo.create(newProject);
  }

  async updateProject(projectId: string, user: AuthenticatedUser, payload: UpdateProjectPayload): Promise<ProjectItem> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED || project.status === ProjectStatus.COMPLETED) {
      throw new ProjectInvalidStatusTransitionException('Cannot modify an archived or completed project.');
    }

    // Prohibit modifying core financial baselines on ACTIVE projects
    if (project.status === ProjectStatus.ACTIVE) {
      if (payload.initialSpent !== undefined && payload.initialSpent !== project.initialSpent) {
        throw new ProjectActiveFinancialModificationException('initialSpent');
      }
      if (payload.budgetCap !== undefined && payload.budgetCap !== project.budgetCap) {
        throw new ProjectActiveFinancialModificationException('budgetCap');
      }
    }

    const isDeanOrFinance = user.role === Role.LEVEL_2_DEAN || user.role === Role.LEVEL_1_FINANCE;
    const isExtendingSchoolProject =
      project.type === ProjectFundingType.SCHOOL &&
      payload.endDate &&
      new Date(payload.endDate) > new Date(project.endDate);

    const nextStatus = (!isDeanOrFinance && isExtendingSchoolProject)
      ? ProjectStatus.PENDING_DEAN_APPROVAL
      : project.status;

    // Calculate new spent baseline if initialSpent is updated in draft/pending state
    const newInitialSpent = payload.initialSpent !== undefined ? Number(payload.initialSpent) : project.initialSpent;
    const targetBudgetCap = payload.budgetCap !== undefined ? Number(payload.budgetCap) : project.budgetCap;

    if (newInitialSpent > targetBudgetCap) {
      throw new ProjectInitialSpentExceedsCapException();
    }

    const { expectedUpdatedAt, ...cleanpayload } = payload;

    const targetStartDate = cleanpayload.startDate ?? project.startDate;
    const targetEndDate = cleanpayload.endDate ?? project.endDate;
    const isTimelineModified = Boolean(cleanpayload.startDate || cleanpayload.endDate);

    const updateData: Partial<ProjectItem> = {
      ...(cleanpayload.name && { name: cleanpayload.name.trim() }),
      ...(cleanpayload.description !== undefined && { description: cleanpayload.description ? cleanpayload.description.trim() : null }),
      ...(cleanpayload.type && { type: cleanpayload.type }),
      ...(cleanpayload.facultyId && { facultyId: cleanpayload.facultyId }),
      ...(cleanpayload.budgetCap !== undefined && { budgetCap: targetBudgetCap }),
      ...(cleanpayload.initialSpent !== undefined && {
        initialSpent: newInitialSpent,
        currentSpent: newInitialSpent, // Sync initial baseline to current spent
      }),
      ...(cleanpayload.startDate && { startDate: new Date(cleanpayload.startDate).toISOString() }),
      ...(cleanpayload.endDate && { endDate: new Date(cleanpayload.endDate).toISOString() }),
      ...(cleanpayload.startDate && { startDate: new Date(cleanpayload.startDate).toISOString() }),
      ...(cleanpayload.endDate && { endDate: new Date(cleanpayload.endDate).toISOString() }),
      ...(isTimelineModified && {
        years: calculateSpannedYears(targetStartDate, targetEndDate),
      }),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.projectRepo.updateWithOptimisticLock(projectId, updateData, expectedUpdatedAt);
  }

  async archiveProject(projectId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new ProjectAlreadyArchivedException();
    }

    if ((project.pendingSpent ?? 0) > 0) {
      throw new ProjectPendingExpensesArchiveException();
    }

    await this.projectRepo.update(projectId, { status: ProjectStatus.ARCHIVED });
  }

  async joinProjectByCode(user: AuthenticatedUser, payload: JoinByCodePayload): Promise<EnrolledActivitySummary> {
    const project = await this.projectRepo.findByJoinCode(payload.code);
    if (!project) {
      throw new InvalidJoinCodeException();
    }

    if (project.type === ProjectFundingType.FACULTY && user.facultyId !== project.facultyId) {
      throw new ForbiddenException('Faculty-funded projects only accept students from the same department.');
    }

    // Atomically verifies conditions, code token, and ACTIVE status inside Firestore Transaction
    const enrolled = await this.projectRepo.enrollStudentViaCode(
      project.id,
      user.uid,
      payload.code,
      [ProjectStatus.ACTIVE]
    );

    return toEnrolledActivitySummary(enrolled);
  }

  async removeStudent(projectId: string, studentId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (!project.joinedStudentIds.includes(studentId)) {
      throw new ProjectStudentNotEnrolledException(studentId);
    }

    await this.projectRepo.removeStudent(projectId, studentId);
  }

  async addStudents(projectId: string, user: AuthenticatedUser, payload: AddParticipantsPayload): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new ProjectRosterLockedException();
    }

    const requestedIds = [...new Set(payload.userIds)];
    if (requestedIds.length === 0) return;

    const existingUsers = await this.userRepo.findByIds(requestedIds);
    const foundUserMap = new Map(existingUsers.map((u) => [u.uid, u]));

    const missingIds = requestedIds.filter((id) => !foundUserMap.has(id));
    if (missingIds.length > 0) {
      throw new ProjectStudentNotFoundException(missingIds);
    }

    const nonStudentAccounts = existingUsers.filter((u) => u.userType !== UserType.STUDENT);
    if (nonStudentAccounts.length > 0) {
      // Map to emails so the Teacher/Dean immediately knows which accounts are invalid
      const invalidEmails = nonStudentAccounts.map(
        (u) => u.email || `${u.fullName} (${u.uid})`
      );
      throw new BadRequestException(
        `Cannot assign non-student accounts to roster: ${invalidEmails.join(', ')}`
      );
    }

    const currentEnrolledSet = new Set(project.joinedStudentIds ?? []);
    const studentsToAdd = requestedIds.filter((id) => !currentEnrolledSet.has(id));

    if (studentsToAdd.length === 0) return;

    await this.projectRepo.addStudentsBulk(projectId, payload.userIds);
  }

  async generateNewJoinCode(
    projectId: string,
    user: AuthenticatedUser,
    payload: GenerateJoinCodePayload
  ): Promise<JoinConfig> {
    const project = await this.validateProjectAccess(projectId, user);

    // Validate date constraints via joinCodeService
    this.joinCodeService.validateJoinCodeSchedule(payload, project.endDate);

    const joinConfig = this.joinCodeService.generateConfig(payload);
    await this.projectRepo.updateJoinConfig(projectId, joinConfig);
    return joinConfig;
  }

  async findById(projectId: string, user: AuthenticatedUser): Promise<ProjectItem> {
    return this.validateProjectAccess(projectId, user);
  }

  async getProjectsForUser(
    user: AuthenticatedUser,
    query?: ProjectQueryPayload
  ): Promise<PaginatedProjectResult> {
    const baseQuery: ProjectQueryPayload = {
      ...query,
      limit: query?.limit ?? 10,
    };

    // 1. Level 1 (Finance): Global Auditing Scope
    if (user.role === Role.LEVEL_1_FINANCE) {
      return this.projectRepo.findWithQuery(baseQuery);
    }

    // 2. Student Context: Enrolled Projects Scope
    if (user.userType === UserType.STUDENT) {
      return this.projectRepo.findWithQuery({ ...baseQuery, studentId: user.uid });
    }

    // 3. Level 2 (Dean): Faculty Boundary Scope
    if (user.role === Role.LEVEL_2_DEAN) {
      return this.projectRepo.findWithQuery({ ...baseQuery, facultyId: user.facultyId });
    }

    // 4. Level 3 (Teacher/Mentor): Personal Projects Scope
    return this.projectRepo.findWithQuery({ ...baseQuery, mentorId: user.uid });
  }

  private async validateProjectAccess(projectId: string, user: AuthenticatedUser): Promise<ProjectItem> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`ProjectItem with ID ${projectId} not found`);
    }

    const isFinanceOfficer = user.role === Role.LEVEL_1_FINANCE;
    const isProjectMentor = project.mentorId === user.uid;
    const isEnrolledStudent = project.joinedStudentIds.includes(user.uid);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && project.facultyId === user.facultyId;

    if (!isFinanceOfficer && !isProjectMentor && !isEnrolledStudent && !isFacultyDean) {
      throw new ForbiddenException('You do not have permission to access or modify this project');
    }

    return project;
  }

  async approveProject(projectId: string, user: AuthenticatedUser): Promise<ProjectItem> {
    const project = await this.validateProjectAccess(projectId, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && project.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    if (project.mentorId === user.uid) {
      throw new ForbiddenException('You cannot approve a project proposal where you are the mentor.');
    }

    let nextStatus: ProjectStatus;

    if (project.status === ProjectStatus.PENDING_DEAN_APPROVAL) {
      if (!isFacultyDean) throw new ProjectApprovalForbiddenException();
      // Route to Finance if school-funded, otherwise activate directly
      nextStatus = project.type === ProjectFundingType.SCHOOL
        ? ProjectStatus.PENDING_FINANCE_APPROVAL
        : ProjectStatus.ACTIVE;
    } else if (project.status === ProjectStatus.PENDING_FINANCE_APPROVAL) {
      if (!isFinance) throw new ProjectApprovalForbiddenException();
      nextStatus = ProjectStatus.ACTIVE;
    } else {
      throw new ProjectInvalidStatusTransitionException('ProjectItem is not in a pending approval state.');
    }

    return this.projectRepo.transitionStatus(
      projectId,
      nextStatus,
      [project.status],
      {
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      }
    );
  }

  async rejectProject(projectId: string, user: AuthenticatedUser, payload?: RejectProjectPayload): Promise<ProjectItem> {
    const project = await this.validateProjectAccess(projectId, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && project.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    if (!isFacultyDean && !isFinance) {
      throw new ProjectApprovalForbiddenException();
    }

    const isPendingApproval =
      project.status === ProjectStatus.PENDING_DEAN_APPROVAL ||
      project.status === ProjectStatus.PENDING_FINANCE_APPROVAL;

    if (!isPendingApproval) {
      throw new ProjectInvalidStatusTransitionException('Only projects pending approval can be rejected.');
    }

    return this.projectRepo.transitionStatus(
      projectId,
      ProjectStatus.REJECTED,
      [ProjectStatus.PENDING_DEAN_APPROVAL, ProjectStatus.PENDING_FINANCE_APPROVAL],
      {
        rejectionReason: payload?.reason?.trim() || null,
        rejectedBy: user.uid,
      }
    );
  }

  async searchStudents(query: string): Promise<StudentSummary[]> {
    const trimmed = query?.trim() ?? '';
    if (trimmed.length < 2) {
      return [];
    }
    return this.projectRepo.searchStudents(trimmed);
  }

  async getProjectStudents(projectId: string, user: AuthenticatedUser): Promise<StudentSummary[]> {
    const project = await this.validateProjectAccess(projectId, user);
    const studentIds = project.joinedStudentIds ?? [];
    if (studentIds.length === 0) return [];

    const users = await this.userRepo.findByIds(studentIds);

    return toStudentSummaryList(users);
  }
}