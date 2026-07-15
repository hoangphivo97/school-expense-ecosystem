import { PartialType } from '@nestjs/swagger';
import { CreateExpenseInput, PaidMethod, PersonalExpenseRequestFilters, ReviewerExpenseRequestFilters, UpdateExpenseInput } from '@school-expense-ecosystem/expenses/types';
import { IsNotEmpty, IsNumber, IsString, IsArray, IsUrl, MaxLength, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseStatus, FacultyId, UserType } from '@school-expense-ecosystem/shared/types';

export class CreateExpenseDto implements CreateExpenseInput {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsNotEmpty()
  @IsString()
  purpose!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNotEmpty()
  @IsArray()
  @IsUrl({}, { each: true })
  proofUrls!: string[];

  @IsNotEmpty()
  @IsEnum(PaidMethod)
  paidMethod!: PaidMethod;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) implements UpdateExpenseInput {}

export class ReviewerExpenseQueryDto implements ReviewerExpenseRequestFilters {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  pageToken?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  month?: number;

  @IsOptional()
  @IsString()
  status?: ExpenseStatus | 'ALL' | null;

  @IsOptional()
  @IsString()
  facultyId?: FacultyId;

  @IsOptional()
  @IsString()
  userType?: UserType;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class PersonalExpenseQueryDto implements Omit<PersonalExpenseRequestFilters, 'userId'> {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  pageToken?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  month?: number;

  @IsOptional()
  @IsString()
  status?: ExpenseStatus | 'ALL' | null;

  @IsOptional()
  @IsString()
  facultyId?: FacultyId;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}