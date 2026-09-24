import { ProjectFundingType, ProjectStatus, UpdateProjectPayload } from '@school-expense-ecosystem/projects/types';
import { BaseUpdateActivityDto } from '../shared/base-activity.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateProjectDto extends BaseUpdateActivityDto implements UpdateProjectPayload {
  @IsOptional()
  @IsEnum(ProjectFundingType)
  type?: ProjectFundingType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}