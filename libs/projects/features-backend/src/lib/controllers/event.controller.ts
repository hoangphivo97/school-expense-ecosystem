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
  CreateEventDto,
  EventQueryDto,
  GenerateJoinCodeDto,
  JoinByCodeDto,
  RejectEventDto,
  UpdateEventDto,
} from '../..';
import { CurrentUser, Roles } from '@school-expense-ecosystem/shared/guards-backend';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  /**
   * Retrieve paginated list of events with query filtering
   */
  @Get()
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  async getEvents(@Query() queryDto: EventQueryDto) {
    return this.eventService.getEvents(queryDto);
  }

  /**
   * Get specific event by ID
   */
  @Get(':id')
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  async getEventById(@Param('id') id: string) {
    return this.eventService.getEventById(id);
  }

  /**
   * Create a new event (Faculty Dean, Admin, or Teacher/Organizer)
   */
  @Post()
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  async createEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createEventDto: CreateEventDto
  ) {
    return this.eventService.createEvent(createEventDto, currentUser.uid);
  }

  /**
   * Update event details
   */
  @Patch(':id')
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateEventDto: UpdateEventDto
  ) {
    return this.eventService.updateEvent(id, updateEventDto);
  }

  /**
   * Generate or update invitation / attendance code for an event
   */
  @Post(':id/join-code')
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  async generateJoinCode(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: GenerateJoinCodeDto
  ) {
    // Generate code logic delegated to EventService
    return this.eventService.generateJoinCode(id, dto, currentUser.uid);
  }

  /**
   * Student self-registration / check-in via event code
   */
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.LEVEL_3_USER)
  async joinByCode(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: JoinByCodeDto
  ) {
    return this.eventService.joinEventByCode(id, dto.code, currentUser.uid);
  }

  /**
   * Reject / Cancel event with a specified reason
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN)
  async rejectEvent(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() rejectDto: RejectEventDto
  ) {
    return this.eventService.rejectEvent(id, rejectDto.reason, currentUser.uid);
  }

}