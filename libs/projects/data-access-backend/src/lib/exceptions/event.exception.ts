import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class EventNotFoundException extends NotFoundException {
  constructor(eventId?: string) {
    super(eventId ? `EventItem with ID "${eventId}" not found.` : 'EventItem does not exist.');
  }
}

export class EventForbiddenException extends ForbiddenException {
  constructor(action = 'access') {
    super(`You do not have permission to ${action} this event.`);
  }
}

export class EventApprovalForbiddenException extends ForbiddenException {
  constructor() {
    super('Only the Faculty Dean or Finance officers have authority to approve or reject event proposals.');
  }
}

export class InvalidEventStateException extends BadRequestException {
  constructor(action: string, status: string) {
    super(`Cannot ${action} when event status is "${status}".`);
  }
}

export class EventInitialSpentExceedsCapException extends BadRequestException {
  constructor() {
    super('Initial spent baseline cannot exceed event budget cap.');
  }
}

export class EventPendingExpensesArchiveException extends ConflictException {
  constructor() {
    super('Cannot archive event with pending expense requests in progress.');
  }
}

export class EventActiveFinancialModificationException extends BadRequestException {
  constructor(field: 'initialSpent' | 'budgetCap') {
    super(`Cannot modify ${field} directly on an active event.`);
  }
}

export class EventStudentNotEnrolledException extends NotFoundException {
  constructor(studentId: string) {
    super(`Student ${studentId} is not registered in this event.`);
  }
}