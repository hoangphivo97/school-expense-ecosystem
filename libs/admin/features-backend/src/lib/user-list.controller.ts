import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { JwtAuthGuard, Roles, RolesGuard } from '@school-expense-ecosystem/backend/auth/features';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_2_DEAN)
export class UserListController {
  constructor(private readonly userListService: UserListService) { }

  @Get()
  async getAllUsersForAdmin(
    @Req() req: { user: UserBase },
    @Query('limit') limit = 10,
    @Query('pageToken') pageToken?: string
  ) {
    const requester = req.user as UserBase;

    return this.userListService.getUsersForAdmin(requester, Number(limit), pageToken);
  }
}