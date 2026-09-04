import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { EventService } from '@school-expense-ecosystem/projects/data-access-backend';
import {
  AddParticipantsDto,
  CreateEventDto,
  EventQueryDto,
  GenerateJoinCodeDto,
  JoinByCodeDto,
  RejectEventDto,
  UpdateEventDto,
} from '../..';
import { CurrentUser, Roles, RolesGuard, UserTypes } from '@school-expense-ecosystem/shared/guards-backend';
import { EventItem } from '@school-expense-ecosystem/projects/types';

@Controller('events')
@UseGuards(RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) { }

  // 1. Get EventItem List (Scoped access)
  @Get()
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER, UserType.STUDENT)
  async getEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: EventQueryDto
  ) {
    return this.eventService.getEventsForUser(user, queryDto);
  }

  // 2. Search Students for Manual Addition
  @Get('students/search')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  async searchStudents(@Query('query') query: string) {
    return this.eventService.searchStudents(query);
  }

  // 3. Student Self-Join via Code
  @Post('join')
  @UserTypes(UserType.STUDENT)
  @HttpCode(HttpStatus.OK)
  async joinByCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinByCodeDto
  ): Promise<EventItem> {
    return this.eventService.joinEventByCode(user, dto);
  }

  // 4. Get EventItem by ID
  @Get(':id')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER, UserType.STUDENT)
  async getEventById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser) {
    return this.eventService.getEventById(id, user);
  }

  // 5. Create EventItem
  @Post()
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createEventDto: CreateEventDto
  ) {
    return this.eventService.createEvent(currentUser, createEventDto);
  }

  // 6. Update EventItem
  @Patch(':id')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateEventDto: UpdateEventDto
  ) {
    return this.eventService.updateEvent(id, currentUser, updateEventDto);
  }

  // 7. Soft Archive EventItem
  @Patch(':id/archive')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async archiveEvent(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.eventService.archiveEvent(id, currentUser);
  }

  // 8. Generate Join Code
  @Post(':id/join-code')
  @Roles(Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async generateJoinCode(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: GenerateJoinCodeDto
  ) {
    return this.eventService.generateJoinCode(id, currentUser, dto);
  }

  // 9. Bulk Add Students to EventItem Roster
  @Post(':id/students')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.OK)
  async addStudents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddParticipantsDto
  ) {
    return this.eventService.addStudentsManually(id, user, dto);
  }

  // 10. Remove Student from EventItem Roster
  @Delete(':id/students/:studentId')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.eventService.removeStudent(id, studentId, user);
  }

  // 11. Reject / Cancel EventItem
  @Patch(':id/reject')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN)
  @HttpCode(HttpStatus.OK)
  async rejectEvent(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() rejectDto: RejectEventDto
  ) {
    return this.eventService.rejectEvent(id, currentUser, rejectDto);
  }

  @Patch(':id/approve')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN)
  @HttpCode(HttpStatus.OK)
  async approveEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.eventService.approveEvent(id, user);
  }

  @Get(':id/students')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER, UserType.STUDENT)
  async getEventStudents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.eventService.getEventStudents(id, user);
  }
}