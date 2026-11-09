import { TopUpDepartmentFundPayload } from '@school-expense-ecosystem/finance/types';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class TopUpDepartmentFundParamsDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  fundId!: string;
}

export class TopUpDepartmentFundDto implements TopUpDepartmentFundPayload {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;
}