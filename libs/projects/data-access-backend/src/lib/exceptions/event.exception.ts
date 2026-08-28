import { HttpException, HttpStatus } from '@nestjs/common';

export class EventNotFoundException extends HttpException {
  constructor(eventId: string) {
    super(`Event with ID '${eventId}' not found.`, HttpStatus.NOT_FOUND);
  }
}

export class EventForbiddenException extends HttpException {
  constructor(action: string) {
    super(`You do not have permission to ${action} this event.`, HttpStatus.FORBIDDEN);
  }
}

export class InvalidEventStateException extends HttpException {
  constructor(action: string, status: string) {
    super(`Cannot ${action} when event status is '${status}'.`, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidEventJoinCodeException extends HttpException {
  constructor() {
    super('Invalid or inactive event join code.', HttpStatus.BAD_REQUEST);
  }
}

export class EventJoinCodeExpiredException extends HttpException {
  constructor() {
    super('Event join code has expired.', HttpStatus.BAD_REQUEST);
  }
}

export class EventCapacityFullException extends HttpException {
  constructor() {
    super('Event registration capacity is full.', HttpStatus.BAD_REQUEST);
  }
}

export class StudentAlreadyRegisteredException extends HttpException {
  constructor(studentId: string) {
    super(`Student with ID '${studentId}' has already registered for this event.`, HttpStatus.CONFLICT);
  }
}