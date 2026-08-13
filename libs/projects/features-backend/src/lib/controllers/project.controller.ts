import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { CurrentUser, Roles, RolesGuard, UserTypes } from '@school-expense-ecosystem/shared/guards-backend';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { CreateProjectDto, GenerateProjectJoinCodeDto } from '../dtos/create-project.dto';

@Controller('projects-manager')
@UseGuards(RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get()
  @Roles(Role.LEVEL_3_USER, Role.LEVEL_2_DEAN, Role.LEVEL_1_FINANCE)
  @UserTypes(UserType.TEACHER)
  async getProjectsForUser(
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.projectService.getProjectsForUser(user);
  }

  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProjectDto: CreateProjectDto
  ) {1797
    return this.projectService.createProject(user, createProjectDto);
  }

  @Get(':id')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
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