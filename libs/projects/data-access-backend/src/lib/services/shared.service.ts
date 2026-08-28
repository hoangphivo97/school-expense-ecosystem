import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { GenerateJoinCodePayload, JoinConfig } from '@school-expense-ecosystem/projects/types';
import {
  EventCapacityFullException,
  EventJoinCodeExpiredException,
  InvalidEventJoinCodeException,
  InvalidEventStateException,
  StudentAlreadyRegisteredException,
} from '../exceptions/event.exception';

export interface JoinableEntity {
  joinedStudentIds: string[];
  joinConfig?: JoinConfig | null;
}

@Injectable()
export class SharedService {
  /**
   * Generates a 6-character random alphanumeric join config
   */
  generateConfig(dto: GenerateJoinCodePayload) {
    const generatedCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    return {
      code: generatedCode,
      maxUses: dto.maxUses,
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Validates code matching, expiration, capacity, and duplicate membership
   */
  validateJoinAttempt(entity: JoinableEntity, code: string, studentId: string): void {
    if (!entity.joinConfig || !entity.joinConfig.isActive || entity.joinConfig.code !== code.trim().toUpperCase()) {
      throw new InvalidEventJoinCodeException();
    }

    const now = new Date();

    if (entity.joinConfig.startsAt && now < new Date(entity.joinConfig.startsAt)) {
      throw new InvalidEventStateException('join before start date', entity.joinConfig.startsAt);
    }

    if (entity.joinConfig.expiresAt && now > new Date(entity.joinConfig.expiresAt)) {
      throw new EventJoinCodeExpiredException();
    }

    if (entity.joinConfig.maxUses && (entity.joinedStudentIds?.length || 0) >= entity.joinConfig.maxUses) {
      throw new EventCapacityFullException();
    }

    if (entity.joinedStudentIds?.includes(studentId)) {
      throw new StudentAlreadyRegisteredException(studentId);
    }
  }
}