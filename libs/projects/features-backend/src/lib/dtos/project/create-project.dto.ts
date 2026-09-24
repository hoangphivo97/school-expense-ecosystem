import { CreateProjectPayload, ProjectFundingType } from "@school-expense-ecosystem/projects/types";
import { BaseActivityDto } from "../shared/base-activity.dto";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateProjectDto extends BaseActivityDto implements CreateProjectPayload {
  @IsEnum(ProjectFundingType)
  @IsNotEmpty()
  type!: ProjectFundingType;

  // Optional: If omitted, backend controller fallbacks to req.user.uid
  @IsOptional()
  @IsString()
  mentorId?: string;
}