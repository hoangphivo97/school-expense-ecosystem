import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateJoinCodeConfig, GenerateJoinCodePayload, JoinConfig } from '@school-expense-ecosystem/projects/types';

@Injectable()
export class SharedService {
  /**
   * Generates a secure random code excluding ambiguous characters (0, O, 1, I)
   */
  generateCode(length = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars.charAt(randomIndex);
    }
    return code;
  }

  /**
   * Validates scheduling constraints for join codes
   */
  validateJoinCodeSchedule(dto: GenerateJoinCodePayload, entityEndDate: string): void {
    const startsAt = new Date(dto.startsAt);
    const expiresAt = new Date(dto.expiresAt);
    const maxEnd = new Date(entityEndDate);

    if (startsAt >= expiresAt) {
      throw new BadRequestException('Start date must be earlier than expiration date.');
    }
    if (expiresAt > maxEnd) {
      throw new BadRequestException('Expiration date cannot exceed the entity end date.');
    }
  }

  /**
   * Generates a standardized join configuration object
   */
  generateConfig(dto: GenerateJoinCodePayload): JoinConfig {
    return {
      code: this.generateCode(6),
      maxUses: dto.maxUses,
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  generateInlineConfig(
    config: CreateJoinCodeConfig,
    entityStartDate: string,
    entityEndDate: string
  ): JoinConfig {
    const startsAt = new Date(entityStartDate).toISOString();
    const expiresAt = config.expiresAt
      ? new Date(config.expiresAt).toISOString()
      : new Date(entityEndDate).toISOString();

    this.validateJoinCodeSchedule(
      { startsAt, expiresAt, maxUses: config.maxUses },
      entityEndDate
    );

    return {
      code: this.generateCode(6),
      maxUses: config.maxUses,
      startsAt,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }
}