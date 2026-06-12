import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { JwtAuthGuard, Roles, RolesGuard } from '@school-expense-ecosystem/backend/auth/features';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_2_DEAN)
export class UserListController {
  constructor(private readonly userListService: UserListService) {}

  @Get()
  async getAllUsers(@Req() req: any): Promise<UserBase[]> {
    const requester = req.user as UserBase;

    return this.userListService.findAllUsers(requester);
  }
}