import { UpdateProjectPayload } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto implements UpdateProjectPayload {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FacultyId)
  facultyId?: FacultyId;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}