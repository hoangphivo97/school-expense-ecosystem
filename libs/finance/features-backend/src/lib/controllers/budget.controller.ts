import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BudgetService } from './budget.services';
import { CreateBudgetDto } from './budget/DTO/create-budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) { }

  @Post()
  @Roles(UserRole.DISBURSER) // Chỉ cấp 1 (Phòng Tài Vụ) được phép vào cửa
  async create(
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: any // Bốc tách userId, email từ JWT Token một cách an toàn
  ) {
    return this.budgetService.createBudget(dto, user);
  }

  // TSK-Edit: Điều chỉnh hạn mức trong năm
  @Patch(':id')
  @Roles(UserRole.DISBURSER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: any
  ) {
    return this.budgetService.updateBudget(id, dto, user);
  }
}