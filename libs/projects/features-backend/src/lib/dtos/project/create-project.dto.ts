import { CreateProjectPayload, ProjectFundingType } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProjectDto implements CreateProjectPayload {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  budgetCap!: number;

  // Architect Fix: Accept legacy audited spent baseline instead of runtime currentSpent
  @IsOptional()
  @IsInt()
  @Min(0)
  initialSpent?: number;

  @IsEnum(ProjectFundingType)
  type!: ProjectFundingType;

  @IsEnum(FacultyId)
  facultyId!: FacultyId;

  // Optional: If omitted, backend controller will automatically fallback to req.user.uid
  @IsOptional()
  @IsString()
  mentorId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  // Optional Join Code configuration upon project creation
  @IsOptional()
  @IsBoolean()
  generateJoinCode?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}