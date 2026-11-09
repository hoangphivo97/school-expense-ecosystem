import { InitializeDepartmentFundPayload } from '@school-expense-ecosystem/finance/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class InitializeDepartmentFundDto implements InitializeDepartmentFundPayload {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(FacultyId)
  @IsNotEmpty()
  facultyId!: FacultyId;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @IsNotEmpty()
  year!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  totalBudget!: number;
}