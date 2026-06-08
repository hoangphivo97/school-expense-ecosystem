import { IsNumber, Min } from 'class-validator';

export class BaseBudgetDto {
  @IsNumber()
  @Min(1, { message: 'Student count must be at least 1.' })
  studentCount!: number;

  @IsNumber()
  @Min(0, { message: 'Quota per student cannot be negative.' })
  quotaPerStudent!: number;

  @IsNumber()
  @Min(0, { message: 'Total budget ceiling cannot be negative.' })
  totalBudgetCeiling!: number;
}