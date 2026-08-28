import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AddParticipantsDto, CreateProjectDto, GenerateJoinCodeDto, JoinByCodeDto, ProjectQueryDto, RejectProjectDto, UpdateProjectDto } from '@school-expense-ecosystem/projects/features-backend';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { JoinConfig, Project, ProjectFundingType, ProjectStatus, StudentSummary } from '@school-expense-ecosystem/projects/types';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import { ProjectActiveFinancialModificationException, ProjectAlreadyArchivedException, ProjectApprovalForbiddenException, ProjectInitialSpentExceedsCapException, ProjectInvalidDateRangeException, ProjectInvalidJoinCodeException, ProjectInvalidStatusTransitionException, ProjectJoinCapacityReachedException, ProjectJoinCodeExpiredException, ProjectJoinDisabledException, ProjectJoinNotStartedException, ProjectPendingExpensesArchiveException, ProjectRosterLockedException, ProjectStudentAlreadyEnrolledException, ProjectStudentNotEnrolledException } from '../exceptions/project.exception';
import { SharedService } from './shared.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly userRepo: UserRepository,
    private readonly sharedService: SharedService
  ) { }

  async createProject(user: AuthenticatedUser, dto: CreateProjectDto): Promise<Project> {
    const isSchoolFunded = dto.type === ProjectFundingType.SCHOOL;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;
    const isDean = user.role === Role.LEVEL_2_DEAN;

    let initialStatus: ProjectStatus;
    if (!isSchoolFunded || isFinance) {
      // Non-school funded projects or projects directly created by Finance are immediately active
      initialStatus = ProjectStatus.ACTIVE;
    } else if (isDean) {
      // Dean creating a school-funded project must route to Finance approval
      initialStatus = ProjectStatus.PENDING_FINANCE_APPROVAL;
    } else {
      // Teachers/Mentors creating a school-funded project route to Dean approval first
      initialStatus = ProjectStatus.PENDING_DEAN_APPROVAL;
    }

    const facultyPrefix = dto.facultyId.toUpperCase();
    const shortHash = randomBytes(3).toString('hex').toUpperCase();
    const projectId = `PRJ-${facultyPrefix}-${shortHash}`;

    const initialSpent = dto.initialSpent ?? 0;
    if (initialSpent > dto.budgetCap) {
      throw new ProjectInitialSpentExceedsCapException();
    }

    const newProject: Project = {
      id: projectId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      budgetCap: dto.budgetCap,
      initialSpent: initialSpent,
      currentSpent: initialSpent,
      pendingSpent: 0,
      status: initialStatus,
      mentorId: dto.mentorId ?? user.uid,
      facultyId: dto.facultyId,
      startDate: new Date(dto.startDate).toISOString(),
      endDate: new Date(dto.endDate).toISOString(),
      joinedStudentIds: [],
      joinConfig: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dto.type === ProjectFundingType.FACULTY) {
      const currentYear = new Date().getFullYear();
      const departmentFundId = `${dto.facultyId.toUpperCase()}_DEPT_${currentYear}`;
      return this.projectRepo.createWithFacultyFund(newProject, departmentFundId);
    }

    return this.projectRepo.create(newProject);
  }

  async updateProject(projectId: string, user: AuthenticatedUser, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED || project.status === ProjectStatus.COMPLETED) {
      throw new ProjectInvalidStatusTransitionException('Cannot modify an archived or completed project.');
    }

    // Prohibit modifying core financial baselines on ACTIVE projects
    if (project.status === ProjectStatus.ACTIVE) {
      if (dto.initialSpent !== undefined && dto.initialSpent !== project.initialSpent) {
        throw new ProjectActiveFinancialModificationException('initialSpent');
      }
      if (dto.budgetCap !== undefined && dto.budgetCap !== project.budgetCap) {
        throw new ProjectActiveFinancialModificationException('budgetCap');
      }
    }

    const isDeanOrFinance = user.role === Role.LEVEL_2_DEAN || user.role === Role.LEVEL_1_FINANCE;
    const isExtendingSchoolProject =
      project.type === ProjectFundingType.SCHOOL &&
      dto.endDate &&
      new Date(dto.endDate) > new Date(project.endDate);

    const nextStatus = (!isDeanOrFinance && isExtendingSchoolProject)
      ? ProjectStatus.PENDING_DEAN_APPROVAL
      : project.status;

    // Calculate new spent baseline if initialSpent is updated in draft/pending state
    const newInitialSpent = dto.initialSpent !== undefined ? Number(dto.initialSpent) : project.initialSpent;
    const targetBudgetCap = dto.budgetCap !== undefined ? Number(dto.budgetCap) : project.budgetCap;

    if (newInitialSpent > targetBudgetCap) {
      throw new ProjectInitialSpentExceedsCapException();
    }

    const updateData: Partial<Project> = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.description !== undefined && { description: dto.description ? dto.description.trim() : null }),
      ...(dto.type && { type: dto.type }),
      ...(dto.facultyId && { facultyId: dto.facultyId }),
      ...(dto.budgetCap !== undefined && { budgetCap: targetBudgetCap }),
      ...(dto.initialSpent !== undefined && {
        initialSpent: newInitialSpent,
        currentSpent: newInitialSpent, // Sync initial baseline to current spent
      }),
      ...(dto.startDate && { startDate: new Date(dto.startDate).toISOString() }),
      ...(dto.endDate && { endDate: new Date(dto.endDate).toISOString() }),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    await this.projectRepo.update(projectId, updateData);
    return { ...project, ...updateData };
  }

  async archiveProject(projectId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new ProjectAlreadyArchivedException();
    }

    if (project.pendingSpent > 0) {
      throw new ProjectPendingExpensesArchiveException();
    }

    await this.projectRepo.update(projectId, { status: ProjectStatus.ARCHIVED });
  }

  async joinProjectByCode(user: AuthenticatedUser, joinDto: JoinByCodeDto): Promise<Project> {
    const project = await this.projectRepo.findByJoinCode(joinDto.code);
    if (!project) {
      throw new ProjectInvalidJoinCodeException();
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new ProjectInvalidStatusTransitionException('Cannot join a project that is not currently active.');
    }

    // Reuse unified validation from SharedService
    this.sharedService.validateJoinAttempt(project, joinDto.code, user.uid);

    // Atomically enroll student via Firestore transaction
    return this.projectRepo.enrollStudentViaCode(project.id, user.uid);
  }

  async removeStudent(projectId: string, studentId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (!project.joinedStudentIds.includes(studentId)) {
      throw new ProjectStudentNotEnrolledException(studentId);
    }

    await this.projectRepo.removeStudent(projectId, studentId);
  }

  async addStudents(projectId: string, user: AuthenticatedUser, dto: AddParticipantsDto): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new ProjectRosterLockedException();
    }

    await this.projectRepo.addStudentsBulk(projectId, dto.userIds);
  }

  async generateNewJoinCode(
    projectId: string,
    user: AuthenticatedUser,
    dto: GenerateJoinCodeDto
  ): Promise<JoinConfig> {
    const project = await this.validateProjectAccess(projectId, user);

    const startsAt = new Date(dto.startsAt);
    const expiresAt = new Date(dto.expiresAt);
    const projectEndDate = new Date(project.endDate);

    if (startsAt >= expiresAt) {
      throw new ProjectInvalidDateRangeException('Start date must be earlier than expiration date.');
    }
    if (expiresAt > projectEndDate) {
      throw new ProjectInvalidDateRangeException('Expiration date cannot exceed project end date.');
    }

    const joinConfig = this.sharedService.generateConfig(dto);
    await this.projectRepo.updateJoinConfig(projectId, joinConfig);
    return joinConfig;
  }

  async findById(projectId: string, user: AuthenticatedUser): Promise<Project> {
    return this.validateProjectAccess(projectId, user);
  }

  async getProjectsForUser(
    user: AuthenticatedUser,
    query?: ProjectQueryDto
  ): Promise<{ items: Project[]; total: number }> {
    const baseQuery = query ?? {};

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

  private async validateProjectAccess(projectId: string, user: AuthenticatedUser): Promise<Project> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
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

  async approveProject(projectId: string, user: AuthenticatedUser): Promise<Project> {
    const project = await this.validateProjectAccess(projectId, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && project.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

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
      throw new ProjectInvalidStatusTransitionException('Project is not in a pending approval state.');
    }

    const updateData: Partial<Project> = {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    await this.projectRepo.update(projectId, updateData);
    return { ...project, ...updateData };
  }

  async rejectProject(projectId: string, user: AuthenticatedUser, dto?: RejectProjectDto): Promise<Project> {
    const project = await this.validateProjectAccess(projectId, user);
    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && project.facultyId === user.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    if (!isFacultyDean && !isFinance) {
      throw new ProjectApprovalForbiddenException();
    }

    if (project.status !== ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new ProjectInvalidStatusTransitionException('Only projects pending approval can be rejected.');
    }

    const updateData: Partial<Project> = {
      status: ProjectStatus.REJECTED,
      rejectionReason: dto?.reason?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    await this.projectRepo.update(projectId, updateData);
    return { ...project, ...updateData };
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

    return users.map((u) => ({
      id: u.uid || (u as any).id,
      studentCode: String(u.userCode || '').trim(),
      fullName: String(u.fullName || '').trim(),
      email: String(u.email || '').trim(),
    }));
  }

  private async generateUniqueJoinCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
    let code = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      code = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      const existing = await this.projectRepo.findByJoinCode(code);
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new InternalServerErrorException('Failed to generate a unique invitation code. Please try again.');
    }

    return code;
  }
}