import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/abstracts/event.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  GenerateJoinCodeDto,
  JoinByCodeDto,
} from '@school-expense-ecosystem/projects/features-backend';
import { Event, EventStatus } from '@school-expense-ecosystem/projects/types';
import { EventNotFoundException, InvalidEventJoinCodeException, InvalidEventStateException } from '../exceptions/event.exception';
import { SharedService } from './shared.service';
import { AuthenticatedUser } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly joinCodeService: SharedService
  ) {}

  async getEvents(query: EventQueryDto) {
    return this.eventRepository.findMany(query);
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) throw new EventNotFoundException(id);
    return event;
  }

  async createEvent(dto: CreateEventDto, organizerId: string): Promise<Event> {
    let joinConfig = null;

    if (dto.generateJoinCode) {
      joinConfig = this.joinCodeService.generateConfig({
        maxUses: dto.maxUses,
        startsAt: dto.startDate,
        expiresAt: dto.expiresAt ?? dto.endDate,
      });
    }

    return this.eventRepository.create({
      ...dto,
      organizerId,
      ...(joinConfig && { joinConfig }),
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    await this.getEventById(id);
    return this.eventRepository.update(id, dto);
  }

  async generateJoinCode(id: string, dto: GenerateJoinCodeDto, userId: string): Promise<Event> {
    const event = await this.getEventById(id);
    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new InvalidEventStateException('generate join code', event.status);
    }

    // Validate date constraints via SharedService
    this.joinCodeService.validateJoinCodeSchedule(dto, event.endDate);

    const joinConfig = this.joinCodeService.generateConfig(dto);
    return this.eventRepository.update(id, { joinConfig });
  }

  async joinEventByCode(user: AuthenticatedUser, joinDto: JoinByCodeDto): Promise<Event> {
    const event = await this.eventRepository.findByJoinCode(joinDto.code);
    if (!event) {
      throw new InvalidEventJoinCodeException();
    }

    // Prohibit joining cancelled or finished events
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new InvalidEventStateException('join event', event.status);
    }

    // Atomically verifies conditions and enrolls student inside Firestore Transaction
    return this.eventRepository.enrollStudentViaCode(event.id, user.uid);
  }

  async searchStudents(query: string) {
    return this.eventRepository.searchStudents(query);
  }

  async addStudentsManually(id: string, studentIds: string[]): Promise<Event> {
    await this.getEventById(id);
    await this.eventRepository.addStudentsBulk(id, studentIds);
    return this.getEventById(id);
  }

  async removeStudent(id: string, studentUid: string): Promise<Event> {
    await this.getEventById(id);
    await this.eventRepository.removeStudent(id, studentUid);
    return this.getEventById(id);
  }

  async rejectEvent(id: string, reason: string, userId: string): Promise<Event> {
    const event = await this.getEventById(id);
    return this.eventRepository.update(id, {
      status: EventStatus.CANCELLED,
      description: event.description
        ? `${event.description}\n[Cancelled]: ${reason}`
        : `[Cancelled]: ${reason}`,
    });
  }

  async archiveEvent(id: string, userId: string): Promise<Event> {
    await this.getEventById(id);
    return this.eventRepository.update(id, {
      status: EventStatus.ARCHIVED,
    });
  }
}