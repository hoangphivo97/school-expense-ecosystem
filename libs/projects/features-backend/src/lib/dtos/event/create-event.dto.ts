import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { EventFundingType } from '@school-expense-ecosystem/projects/types';

export class CreateEventDto {
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

  @IsNumber()
  @Min(1)
  budgetCap!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialSpent?: number;

  @IsISO8601()
  @IsNotEmpty()
  startDate!: string;

  @IsISO8601()
  @IsNotEmpty()
  endDate!: string;
}