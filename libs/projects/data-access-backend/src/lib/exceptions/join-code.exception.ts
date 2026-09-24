import { BadRequestException, ConflictException, GoneException, NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID "${id}" was not found.`);
  }
}

export class JoinCodeDisabledException extends BadRequestException {
  constructor() {
    super('Join code registration is currently disabled for this entity.');
  }
}

export class JoinCodeNotStartedException extends BadRequestException {
  constructor(startsAt: string) {
    super(`Join code registration will open at ${startsAt}.`);
  }
}

export class JoinCodeExpiredException extends GoneException {
  constructor() {
    super('The invitation code has expired.');
  }
}

export class JoinCapacityReachedException extends ConflictException {
  constructor() {
    super('Registration capacity has been reached.');
  }
}

export class StudentAlreadyEnrolledException extends ConflictException {
  constructor(studentId?: string) {
    super(studentId ? `Student ${studentId} is already enrolled.` : 'You are already enrolled.');
  }
}

export class InvalidJoinCodeException extends BadRequestException {
  constructor() {
    super('The provided join code is invalid or inactive.');
  }
}