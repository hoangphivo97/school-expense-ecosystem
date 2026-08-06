import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AddStudentsToProjectDto, CreateProjectDto, GenerateProjectJoinCodeDto, ProjectService } from '@school-expense-ecosystem/finance/data-access-backend';
import { CurrentUser } from '@school-expense-ecosystem/shared/guards-backend';
import { AuthenticatedUser } from '@school-expense-ecosystem/shared/types';

@Controller('finance/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.projectService.findAll(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // TODO: Attach @Roles('TEACHER', 'DEAN') guard here to secure project creation pipeline
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(createProjectDto);
  }

  @Get(':id')
  // TODO: Attach @Roles('TEACHER', 'DEAN', 'FINANCE') guard here to secure single project querying
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.findById(id, user);
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