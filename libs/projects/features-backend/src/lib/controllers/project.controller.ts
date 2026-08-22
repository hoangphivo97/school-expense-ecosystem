import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
  Get, 
  Patch, 
  Delete, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ProjectService } from '@school-expense-ecosystem/projects/data-access-backend';
import { CurrentUser, Roles, RolesGuard, UserTypes } from '@school-expense-ecosystem/shared/guards-backend';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AddStudentsToProjectDto, CreateProjectDto, GenerateProjectJoinCodeDto, JoinProjectByCodeDto, ProjectQueryDto, RejectProjectDto, UpdateProjectDto } from '../..';

@Controller('projects-manager')
@UseGuards(RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // 1. Get Project List (Accessible to Teachers, Students, Deans, Finance)
  @Get()
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER, UserType.STUDENT)
  async getProjectsForUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProjectQueryDto
  ) {
    return this.projectService.getProjectsForUser(user, query);
  }

  // 2. Create New Project (Restricted to Faculty Mentors & Leadership)
  @Post()
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProjectDto: CreateProjectDto
  ) {
    return this.projectService.createProject(user, createProjectDto);
  }

  // 3. Student Join Project via Code
  @Post('join')
  @UserTypes(UserType.STUDENT)
  @HttpCode(HttpStatus.OK)
  async joinByCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() joinDto: JoinProjectByCodeDto
  ) {
    return this.projectService.joinProjectByCode(user, joinDto);
  }

  // 4. Get Project Details by ID
  @Get(':id')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER, UserType.STUDENT)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.projectService.findById(id, user);
  }

  // 5. Update Project General Information
  @Patch(':id')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateProjectDto
  ) {
    return this.projectService.updateProject(id, user, updateDto);
  }

  // 6. Archive Project (Soft Delete)
  @Patch(':id/archive')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.projectService.archiveProject(id, user);
  }

  // 7. Generate or Refresh Join Invitation Code
  @Post(':id/join-code')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async generateJoinCode(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() generateCodeDto: GenerateProjectJoinCodeDto
  ) {
    return this.projectService.generateNewJoinCode(projectId, user, generateCodeDto);
  }

  // 8. Bulk Add Students to Project
  @Post(':id/students')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async addStudents(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() addStudentsDto: AddStudentsToProjectDto
  ) {
    return this.projectService.addStudents(projectId, user, addStudentsDto);
  }

  // 9. Remove Student from Project
  @Delete(':id/students/:studentId')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStudent(
    @Param('id') projectId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.projectService.removeStudent(projectId, studentId, user);
  }

  // Approve Project Proposal
  @Patch(':id/approve')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.projectService.approveProject(id, user);
  }

  // Reject Project Proposal
  @Patch(':id/reject')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() rejectDto?: RejectProjectDto
  ) {
    return this.projectService.rejectProject(id, user, rejectDto);
  }
}