import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AddStudentsToProjectDto, CreateProjectDto, GenerateProjectJoinCodeDto, JoinProjectByCodeDto, ProjectQueryDto, RejectProjectDto, UpdateProjectDto } from '@school-expense-ecosystem/projects/features-backend';
import { ProjectRepository } from '../repositories/abstracts/project.repository';
import { Project, ProjectFundingType, ProjectJoinConfig, ProjectStatus, StudentSummary } from '@school-expense-ecosystem/projects/types';

@Injectable()
export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository) { }

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
      throw new BadRequestException('Initial spent baseline cannot exceed project budget cap');
    }

    // Optional Join Code initialization
    let joinConfig: Project['joinConfig'] | null = null;
    if (dto.generateJoinCode || dto.maxUses) {
      joinConfig = {
        code: `PRJ-${randomBytes(3).toString('hex').toUpperCase()}`,
        maxUses: dto.maxUses ?? 30,
        usedCount: 0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt).toISOString() : new Date(dto.endDate).toISOString(),
      };
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
      joinConfig: joinConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.projectRepo.create(newProject);
  }

  async updateProject(projectId: string, user: AuthenticatedUser, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED || project.status === ProjectStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify an archived or completed project');
    }

    // Prohibit modifying core financial baselines on ACTIVE projects
    if (project.status === ProjectStatus.ACTIVE) {
      if (dto.initialSpent !== undefined && dto.initialSpent !== project.initialSpent) {
        throw new BadRequestException('Cannot modify initial spent baseline on an active project');
      }
      if (dto.budgetCap !== undefined && dto.budgetCap !== project.budgetCap) {
        throw new BadRequestException('Cannot modify budget cap directly on an active project');
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
      throw new BadRequestException('Initial spent cannot exceed project budget cap');
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
      throw new BadRequestException('Project is already archived');
    }

    if (project.pendingSpent > 0) {
      throw new BadRequestException('Cannot archive project with pending expense requests in progress');
    }

    await this.projectRepo.update(projectId, { status: ProjectStatus.ARCHIVED });
  }

  async joinProjectByCode(user: AuthenticatedUser, dto: JoinProjectByCodeDto): Promise<Project> {
    const project = await this.projectRepo.findByJoinCode(dto.code.trim().toUpperCase());
    if (!project) {
      throw new NotFoundException('Invalid invitation code or project does not exist');
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Cannot join a project that is not currently active');
    }

    if (!project.joinConfig) {
      throw new BadRequestException('Invitation joining is disabled for this project');
    }

    if (new Date(project.joinConfig.expiresAt) < new Date()) {
      throw new BadRequestException('The project invitation code has expired');
    }

    if (project.joinConfig.usedCount >= project.joinConfig.maxUses) {
      throw new BadRequestException('The maximum recruitment capacity for this code has been reached');
    }

    if (project.joinedStudentIds.includes(user.uid)) {
      throw new ConflictException('You are already enrolled in this project');
    }

    await this.projectRepo.addStudentsBulk(project.id, [user.uid]);
    await this.projectRepo.updateJoinConfig(project.id, {
      ...project.joinConfig,
      usedCount: project.joinConfig.usedCount + 1,
    });

    return project;
  }

  async removeStudent(projectId: string, studentId: string, user: AuthenticatedUser): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (!project.joinedStudentIds.includes(studentId)) {
      throw new NotFoundException(`Student ${studentId} is not enrolled in this project`);
    }

    await this.projectRepo.removeStudent(projectId, studentId);
  }

  async addStudents(projectId: string, user: AuthenticatedUser, dto: AddStudentsToProjectDto): Promise<void> {
    const project = await this.validateProjectAccess(projectId, user);

    if (project.status === ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new BadRequestException('Cannot modify student roster while project approval is pending');
    }

    await this.projectRepo.addStudentsBulk(projectId, dto.studentIds);
  }

  async generateNewJoinCode(projectId: string, user: AuthenticatedUser, dto: GenerateProjectJoinCodeDto): Promise<ProjectJoinConfig> {
    const project = await this.validateProjectAccess(projectId, user);

    const secureCode = `PRJ-${randomBytes(3).toString('hex').toUpperCase()}`;
    const newConfig: ProjectJoinConfig = {
      code: secureCode,
      maxUses: dto.maxUses,
      usedCount: 0,
      expiresAt: new Date(dto.expiresAt).toISOString(),
    };

    await this.projectRepo.updateJoinConfig(projectId, newConfig);
    return newConfig;
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
      throw new ForbiddenException('Only the Faculty Dean or Finance can approve project proposals');
    }

    if (project.status !== ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new BadRequestException('Only projects pending approval can be approved');
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
      throw new ForbiddenException('Only the Faculty Dean or Finance can reject project proposals');
    }

    if (project.status !== ProjectStatus.PENDING_DEAN_APPROVAL) {
      throw new BadRequestException('Only projects pending approval can be rejected');
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
}