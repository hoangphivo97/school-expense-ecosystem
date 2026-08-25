import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AddStudentsToProjectDto, CreateProjectDto, GenerateProjectJoinCodeDto, JoinProjectByCodeDto, ProjectQueryDto, RejectProjectDto, UpdateProjectDto } from '@school-expense-ecosystem/projects/features-backend';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { Project, ProjectFundingType, ProjectJoinConfig, ProjectStatus, StudentSummary } from '@school-expense-ecosystem/projects/types';
import { UserRepository } from '@school-expense-ecosystem/admin/features-backend';
import { ProjectActiveFinancialModificationException, ProjectAlreadyArchivedException, ProjectApprovalForbiddenException, ProjectInitialSpentExceedsCapException, ProjectInvalidDateRangeException, ProjectInvalidJoinCodeException, ProjectInvalidStatusTransitionException, ProjectJoinCapacityReachedException, ProjectJoinCodeExpiredException, ProjectJoinDisabledException, ProjectJoinNotStartedException, ProjectPendingExpensesArchiveException, ProjectRosterLockedException, ProjectStudentAlreadyEnrolledException, ProjectStudentNotEnrolledException } from '../exceptions/project.exception';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly userRepo: UserRepository,
  ) { }

  async createProject(user: AuthenticatedUser, dto: CreateProjectDto): Promise<Project> {
    const hasApprovalAuthority = user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_2_DEAN;
    const initialStatus: ProjectStatus = hasApprovalAuthority || dto.type !== ProjectFundingType.SCHOOL
      ? ProjectStatus.ACTIVE
      : ProjectStatus.PENDING_DEAN_APPROVAL;

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

  async joinProjectByCode(user: AuthenticatedUser, joinDto: JoinProjectByCodeDto): Promise<Project> {
    const project = await this.projectRepo.findByJoinCode(joinDto.code);
    if (!project) {
      throw new ProjectInvalidJoinCodeException();
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new ProjectInvalidStatusTransitionException('Cannot join a project that is not currently active.');
    }

    if (!project.joinConfig) {
      throw new ProjectJoinDisabledException();
    }

    const now = new Date();
    if (now < new Date(project.joinConfig.startsAt)) {
      throw new ProjectJoinNotStartedException(project.joinConfig.startsAt);
    }

    if (new Date(project.joinConfig.expiresAt) < now) {
      throw new ProjectJoinCodeExpiredException();
    }

    if (project.joinedStudentIds.includes(user.uid)) {
      throw new ProjectStudentAlreadyEnrolledException();
    }

    if (project.joinConfig.usedCount >= project.joinConfig.maxUses) {
      throw new ProjectJoinCapacityReachedException();
    }

    // Add student and increment usedCount in Firestore transaction
    return this.projectRepo.enrollStudentViaCode(project.id, user.uid);
  }

  async removeStudent(projectId: string, studentId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (!project.joinedStudentIds.includes(studentId)) {
      throw new ProjectStudentNotEnrolledException(studentId);
    }

    await this.projectRepo.removeStudent(projectId, studentId);
  }

  async addStudents(projectId: string, user: AuthenticatedUser, dto: AddStudentsToProjectDto): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new ProjectRosterLockedException();
    }

    await this.projectRepo.addStudentsBulk(projectId, dto.studentIds);
  }

  async generateNewJoinCode(
    projectId: string,
    user: AuthenticatedUser,
    dto: GenerateProjectJoinCodeDto
  ): Promise<ProjectJoinConfig> {
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

    const code = await this.generateUniqueJoinCode();
    const joinConfig: ProjectJoinConfig = {
      code,
      maxUses: dto.maxUses,
      usedCount: 0,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

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

    if (!isFacultyDean && !isFinance) {
      throw new ProjectApprovalForbiddenException();
    }

    if (project.status !== ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new ProjectInvalidStatusTransitionException('Only projects pending approval can be approved.');
    }

    const updateData: Partial<Project> = {
      status: ProjectStatus.ACTIVE,
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