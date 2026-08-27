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