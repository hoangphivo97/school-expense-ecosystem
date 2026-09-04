import { CreateJoinCodeConfig } from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateJoinCodeConfigDto implements CreateJoinCodeConfig {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export abstract class BaseActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(FacultyId)
  @IsNotEmpty()
  facultyId!: FacultyId;

  @IsInt()
  @IsPositive()
  budgetCap!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialSpent?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  // Validate nested join code options when provided
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateJoinCodeConfigDto)
  joinCodeConfig?: CreateJoinCodeConfigDto;
}

export abstract class BaseActivityQueryDto {
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
  @IsEnum(FacultyId)
  facultyId?: FacultyId;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class RejectReasonDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason!: string;
}

export abstract class BaseUpdateActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(FacultyId)
  facultyId?: FacultyId;

  @IsOptional()
  @IsInt()
  @Min(1)
  budgetCap?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialSpent?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}