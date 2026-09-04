import { ProjectFundingType, ProjectQueryPayload, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseActivityQueryDto } from '../shared/base-activity.dto';

export class ProjectQueryDto extends BaseActivityQueryDto implements ProjectQueryPayload {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectFundingType)
  type?: ProjectFundingType;

  @IsOptional()
  @IsString()
  mentorId?: string;
}