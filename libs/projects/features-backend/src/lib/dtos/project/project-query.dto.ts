import { ProjectFundingType, ProjectQueryPayload, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProjectQueryDto implements ProjectQueryPayload {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectFundingType)
  type?: ProjectFundingType;

  @IsOptional()
  @IsEnum(FacultyId)
  facultyId?: FacultyId;

  @IsOptional()
  @IsString()
  mentorId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}