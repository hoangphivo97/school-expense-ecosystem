import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/abstracts/event.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  GenerateJoinCodeDto,
} from '@school-expense-ecosystem/projects/features-backend';
import { Event, EventStatus } from '@school-expense-ecosystem/projects/types';
import { EventNotFoundException, InvalidEventStateException } from '../exceptions/event.exception';
import { SharedService } from './shared.service';

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
    return this.eventRepository.create({ ...dto, organizerId });
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

    const joinConfig = this.joinCodeService.generateConfig(dto);
    return this.eventRepository.update(id, { joinConfig });
  }

  async joinEventByCode(id: string, code: string, studentId: string): Promise<Event> {
    const event = await this.getEventById(id);
    this.joinCodeService.validateJoinAttempt(event, code, studentId);

    await this.eventRepository.addStudentsBulk(id, [studentId]);
    return this.getEventById(id);
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