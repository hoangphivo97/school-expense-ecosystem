import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventFundingType, EventQueryPayload, EventStatus } from '@school-expense-ecosystem/projects/types';
import { BaseActivityQueryDto } from '../shared/base-activity.dto';

export class EventQueryDto extends BaseActivityQueryDto implements EventQueryPayload {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventFundingType)
  type?: EventFundingType;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  organizerId?: string;
}