import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { BudgetBackendService } from "@school-expense-ecosystem/finance/data-access-backend";
import { CurrentUser, JwtAuthGuard, RolesGuard } from "@school-expense-ecosystem/shared/guards-backend";
import { AuthenticatedUser } from "@school-expense-ecosystem/shared/types";
import { InitializeDepartmentFundDto } from "../dtos/faculty/initialize-departmant-fund.dto";
import { GetAnnualFundsQueryDto } from "../dtos/faculty/get-annual-funds-query.dto";
import { DepartmentFund } from "@school-expense-ecosystem/finance/types";
import { DeductDepartmentFundDto, DepartmentFundParamsDto, TopUpDepartmentFundDto } from "../dtos/faculty/adjust-department-fund.dto";


@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetBackendService) {}

  @Post('initialize')
  async initializeDepartmentFund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitializeDepartmentFundDto
  ): Promise<DepartmentFund> {
    return this.budgetService.initializeDepartmentFund(user, dto);
  }

  @Patch(':fundId/top-up')
  async topUpDepartmentFund(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: DepartmentFundParamsDto,
    @Body() dto: TopUpDepartmentFundDto
  ): Promise<DepartmentFund> {
    return this.budgetService.topUpDepartmentFund(user, params.fundId, dto);
  }

  @Patch(':fundId/deduct')
  async deductDepartmentFund(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: DepartmentFundParamsDto,
    @Body() dto: DeductDepartmentFundDto
  ): Promise<DepartmentFund> {
    return this.budgetService.deductDepartmentFund(user, params.fundId, dto);
  }

  @Get('overview')
  async getAnnualDepartmentFundsOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnnualFundsQueryDto
  ): Promise<DepartmentFund[]> {
    return this.budgetService.getAnnualDepartmentFundsOverview(user, query.year);
  }
}