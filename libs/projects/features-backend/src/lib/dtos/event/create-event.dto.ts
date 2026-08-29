import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { CreateEventPayload, EventFundingType } from '@school-expense-ecosystem/projects/types';

export class CreateEventDto implements CreateEventPayload {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsEnum(FacultyId)
  @IsNotEmpty()
  facultyId!: FacultyId;

  @IsEnum(EventFundingType)
  @IsNotEmpty()
  type!: EventFundingType;

  @IsInt()
  @IsPositive()
  budgetCap!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  initialSpent?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  // Optional Join Code configuration upon creation
  @IsOptional()
  @IsBoolean()
  generateJoinCode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}