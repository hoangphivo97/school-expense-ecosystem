import { AdjustDepartmentFundPayload, DeductDepartmentFundPayload, DepartmentFundParamsPayload, TopUpDepartmentFundPayload } from "@school-expense-ecosystem/finance/types";
import { AuditableBudgetDto } from "../auditable-budget.dto";
import { Transform, Type } from "class-transformer";
import { IsNumber, Min, IsNotEmpty, IsString } from "class-validator";

export class AdjustDepartmentFundDto
  extends AuditableBudgetDto
  implements AdjustDepartmentFundPayload {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;
}

export class TopUpDepartmentFundDto
  extends AdjustDepartmentFundDto
  implements TopUpDepartmentFundPayload { }

export class DepartmentFundParamsDto implements DepartmentFundParamsPayload {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  fundId!: string;
}

export class DeductDepartmentFundDto
  extends AdjustDepartmentFundDto
  implements DeductDepartmentFundPayload {}
