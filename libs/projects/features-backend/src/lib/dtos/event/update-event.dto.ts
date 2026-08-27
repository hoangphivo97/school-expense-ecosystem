import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { EventFundingType, EventStatus, UpdateEventPayload } from '@school-expense-ecosystem/projects/types';

export class UpdateEventDto implements UpdateEventPayload {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsEnum(FacultyId)
  @IsOptional()
  facultyId?: FacultyId;

  @IsEnum(EventFundingType)
  @IsOptional()
  type?: EventFundingType;

  @IsNumber()
  @Min(1)
  @IsOptional()
  budgetCap?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialSpent?: number;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}