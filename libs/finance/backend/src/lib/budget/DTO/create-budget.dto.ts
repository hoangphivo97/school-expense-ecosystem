import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BaseBudgetDto } from './base-budget.dto';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

export class CreateBudgetDto extends BaseBudgetDto {
  @IsEnum(FacultyId, { message: 'Invalid domain faculty identifier code.' })
  @IsNotEmpty()
  facultyId!: string;

  @IsString()
  @IsNotEmpty()
  facultyName!: string;
}