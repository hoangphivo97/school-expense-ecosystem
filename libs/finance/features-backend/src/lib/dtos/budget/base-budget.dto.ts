import { IsNumber, Min } from 'class-validator';

export class BaseBudgetDto {
  @IsNumber()
  @Min(0, { message: 'Total budget ceiling cannot be negative.' })
  totalBudgetCeiling!: number;
}