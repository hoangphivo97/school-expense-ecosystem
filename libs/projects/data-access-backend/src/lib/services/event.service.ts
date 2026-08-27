import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/abstracts/event.repository';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from '@school-expense-ecosystem/projects/features-backend';
import { Event } from '@school-expense-ecosystem/projects/types';
import { EventNotFoundException } from '../exceptions/event.exception';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

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
}