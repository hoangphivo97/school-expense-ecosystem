import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { BudgetBackendService } from "@school-expense-ecosystem/finance/data-access-backend";
import { CurrentUser, JwtAuthGuard, RolesGuard } from "@school-expense-ecosystem/shared/guards-backend";
import { AuthenticatedUser, DepartmentFundBalanceResult } from "@school-expense-ecosystem/shared/types";
import { InitializeDepartmentFundDto } from "../dtos/faculty/initialize-departmant-fund.dto";
import { TopUpDepartmentFundDto, TopUpDepartmentFundParamsDto } from "../dtos/faculty/top-up-department-fund.dto";
import { GetAnnualFundsQueryDto } from "../dtos/faculty/get-annual-funds-query.dto";


@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetBackendService) { }

  @Post('initialize')
  async initializeDepartmentFund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitializeDepartmentFundDto
  ): Promise<DepartmentFundBalanceResult> {
    return this.budgetService.initializeDepartmentFund(user, dto);
  }
  @Patch(':fundId/top-up')
  async topUpDepartmentFund(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: TopUpDepartmentFundParamsDto,
    @Body() dto: TopUpDepartmentFundDto
  ): Promise<DepartmentFundBalanceResult> {
    return this.budgetService.topUpDepartmentFund(user, params.fundId, dto);
  }

  @Get('overview')
  async getAnnualDepartmentFundsOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnnualFundsQueryDto
  ): Promise<DepartmentFundBalanceResult[]> {
    return this.budgetService.getAnnualDepartmentFundsOverview(user, query.year);
  }

}