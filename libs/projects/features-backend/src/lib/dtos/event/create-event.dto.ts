import { CreateEventPayload, EventFundingType } from '@school-expense-ecosystem/projects/types';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { BaseActivityDto } from '../shared/base-activity.dto';

export class CreateEventDto extends BaseActivityDto implements CreateEventPayload {
  @IsEnum(EventFundingType)
  @IsNotEmpty()
  type!: EventFundingType;

  @ValidateIf((o: CreateEventDto) => o.type === EventFundingType.PROJECT)
  @IsNotEmpty({ message: 'projectId is mandatory when event funding type is PROJECT' })
  @IsString()
  projectId?: string;
}