import { UpdateEventPayload, EventFundingType, EventStatus } from "@school-expense-ecosystem/projects/types";
import { IsOptional, IsEnum, IsString } from "class-validator";
import { BaseUpdateActivityDto } from "../shared/base-activity.dto";


export class UpdateEventDto extends BaseUpdateActivityDto implements UpdateEventPayload {
  @IsOptional()
  @IsEnum(EventFundingType)
  type?: EventFundingType;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}