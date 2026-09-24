import { ConflictException } from '@nestjs/common';

export class ConcurrencyConflictException extends ConflictException {
  constructor(message = 'Resource was updated or approved by another user. Please refresh and try again.') {
    super(message);
  }
}