import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BaseBudgetDto } from './base-budget.dto';
import { FacultyId } from '@school-expense-ecosystem/auth/types'; // Giả định enum mã khoa của bạn

export class CreateBudgetDto extends BaseBudgetDto {
  @IsEnum(FacultyId, { message: 'Invalid domain faculty identifier code.' })
  @IsNotEmpty()
  facultyId!: string;

  @IsString()
  @IsNotEmpty()
  facultyName!: string;
}