import { ProjectFundingType, UpdateProjectPayload } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProjectDto implements UpdateProjectPayload {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(ProjectFundingType)
  type?: ProjectFundingType;

  @IsOptional()
  @IsEnum(FacultyId)
  facultyId?: FacultyId;

  @IsOptional()
  @IsNumber()
  @Min(1)
  budgetCap?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialSpent?: number;
}