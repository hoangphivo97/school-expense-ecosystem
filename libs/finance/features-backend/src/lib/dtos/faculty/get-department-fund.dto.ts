import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";

export class GetDepartmentFundBalanceParamsDto {
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsEnum(FacultyId)
  id!: FacultyId;
}

export class GetDepartmentFundBalanceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}