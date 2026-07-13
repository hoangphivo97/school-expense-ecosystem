import { PartialType } from '@nestjs/swagger';
import { CreateExpenseInput, PaidMethod, UpdateExpenseInput } from '@school-expense-ecosystem/expenses/types';
import { IsNotEmpty, IsNumber, IsString, IsArray, IsUrl, MaxLength, Min, IsEnum } from 'class-validator';

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