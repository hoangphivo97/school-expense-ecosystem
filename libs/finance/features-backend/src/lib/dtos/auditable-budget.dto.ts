import {
  AuditableBudgetPayload,
  BudgetReferenceDocType,
} from '@school-expense-ecosystem/finance/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AuditableBudgetDto implements AuditableBudgetPayload {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(BudgetReferenceDocType)
  @IsNotEmpty()
  referenceDocType!: BudgetReferenceDocType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Reference document number is required for audit compliance.' })
  @MinLength(3, { message: 'Reference document number must be at least 3 characters long.' })
  @MaxLength(100, { message: 'Reference document number cannot exceed 100 characters.' })
  referenceDocNo!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Audit reason is required.' })
  @MinLength(5, { message: 'Audit reason must be at least 5 characters long.' })
  @MaxLength(500, { message: 'Audit reason cannot exceed 500 characters.' })
  reason!: string;
}