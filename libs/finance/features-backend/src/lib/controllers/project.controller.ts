import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AddStudentsToProjectDto, CreateProjectDto, GenerateProjectJoinCodeDto, ProjectService } from '@school-expense-ecosystem/finance/data-access-backend';

@Controller('finance/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // TODO: Attach @Roles('TEACHER', 'DEAN') guard here to secure project creation pipeline
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(createProjectDto);
  }

  @Post(':id/students')
  @HttpCode(HttpStatus.OK)
  // TODO: Attach @Roles('TEACHER') guard here to restrict explicit list expansion to owner mentors
  async addStudents(
    @Param('id') projectId: string,
    @Body() addStudentsDto: AddStudentsToProjectDto,
  ) {
    return this.projectService.addStudents(projectId, addStudentsDto);
  }

  @Post(':id/join-code')
  @HttpCode(HttpStatus.OK)
  // TODO: Attach @Roles('TEACHER') guard here to secure explicit invitation provisioning
  async generateJoinCode(
    @Param('id') projectId: string,
    @Body() generateCodeDto: GenerateProjectJoinCodeDto,
  ) {
    return this.projectService.generateNewJoinCode(projectId, generateCodeDto);
  }
}