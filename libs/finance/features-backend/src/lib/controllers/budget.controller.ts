import { Controller, UseGuards } from "@nestjs/common";
import { BudgetBackendService } from "@school-expense-ecosystem/finance/data-access-backend";
import { JwtAuthGuard, RolesGuard } from "@school-expense-ecosystem/shared/guards-backend";


@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetBackendService) { }


}