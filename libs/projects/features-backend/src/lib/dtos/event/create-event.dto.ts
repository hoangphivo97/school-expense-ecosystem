import { CreateEventPayload, EventFundingType } from '@school-expense-ecosystem/projects/types';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseActivityDto } from '../shared/base-activity.dto';

export class CreateEventDto extends BaseActivityDto implements CreateEventPayload {
  @IsEnum(EventFundingType)
  @IsNotEmpty()
  type!: EventFundingType;

  // Optional reference linking event under a parent project scope
  @IsOptional()
  @IsString()
  projectId?: string;
}