import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../project.repository';
import { CreateProjectDto, AddStudentsToProjectDto, GenerateProjectJoinCodeDto } from '../DTO/project/create-project.dto';
import { Project, ProjectFundingType, ProjectStatus } from '@school-expense-ecosystem/finance/types';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async createProject(dto: CreateProjectDto): Promise<Project> {
    // Determine the initial approval workflow status based on funding source
    const initialStatus: ProjectStatus = dto.type === ProjectFundingType.SCHOOL 
      ? ProjectStatus.PENDING_DEAN_APPROVAL
      : ProjectStatus.ACTIVE;

    const facultyPrefix = dto.facultyId.toUpperCase();
    const shortHash = randomBytes(3).toString('hex').toUpperCase();
    const projectId = `PRJ-${facultyPrefix}-${shortHash}`;
    
    // Generate an initial safe invitation code block using standard crypto utilities
    const generatedCode = randomBytes(3).toString('hex').toUpperCase();

    const newProject: Project = {
      id: projectId,
      name: dto.name,
      type: dto.type,
      budgetCap: dto.budgetCap,
      currentSpent: dto.currentSpent ?? 0,
      status: initialStatus,
      mentorId: dto.mentorId,
      facultyId: dto.facultyId,
      deanId: dto.deanId,
      startDate: new Date(dto.startDate).toISOString(),
      endDate: new Date(dto.endDate).toISOString(),
      joinedStudentIds: [],
      joinConfig: {
        code: generatedCode,
        maxUses: dto.maxUses,
        usedCount: 0,
        expiresAt: new Date(dto.expiresAt).toISOString(),
      }
    };

    return this.projectRepo.create(newProject);
  }

  async addStudents(projectId: string, dto: AddStudentsToProjectDto): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Defensive Check: Prevent roster mutation if the project has not cleared financial approval
    if (project.status === 'PENDING_DEAN_APPROVAL') {
      throw new BadRequestException('Cannot modify student roster while project approval is pending');
    }

    await this.projectRepo.addStudentsBulk(projectId, dto.studentIds);
  }

  async generateNewJoinCode(projectId: string, dto: GenerateProjectJoinCodeDto): Promise<Project['joinConfig']> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const secureCode = `PRJ-${randomBytes(3).toString('hex').toUpperCase()}`;
    const newConfig: Project['joinConfig'] = {
      code: secureCode,
      maxUses: dto.maxUses,
      usedCount: 0,
      expiresAt: new Date(dto.expiresAt).toISOString(),
    };

    await this.projectRepo.updateJoinConfig(projectId, newConfig);
    return newConfig;
  }
}