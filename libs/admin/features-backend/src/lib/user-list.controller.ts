import { Controller, Get, UseGuards, Req, Query, Post, Body, Patch, Param } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/shared/types';
import { JwtAuthGuard, RolesGuard, Roles } from '@school-expense-ecosystem/shared/guards-backend';
import { ChangeUserStatusDto, CreateUserDto, UpdateUserDto } from '@school-expense-ecosystem/admin/data-access-backend';
import { IAdminExecutor } from '@school-expense-ecosystem/admin/types';


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

  @Post('provision')
  @Roles(Role.LEVEL_0_ADMIN)
  async manualAccountProvisioning(@Req() req: { user: UserBase }, @Body() createUserDto: CreateUserDto) {
    const executor: IAdminExecutor = { uid: req.user.uid, email: req.user.email };
    return this.userListService.provisionNewUserByAdmin(executor, createUserDto);
  }

  @Patch(':id')
  @Roles(Role.LEVEL_0_ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Req() req: { user: UserBase },
    @Body() updateUserDto: UpdateUserDto
  ) {
    const executor: IAdminExecutor = { uid: req.user.uid, email: req.user.email };
    return this.userListService.updateUserByAdmin(id, executor, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(Role.LEVEL_0_ADMIN)
  async changeUserStatus(
    @Param('id') id: string,
    @Req() req: { user: UserBase },
    @Body() changeUserStatusDto: ChangeUserStatusDto
  ) {
    const executor: IAdminExecutor = { uid: req.user.uid, email: req.user.email };

    return this.userListService.updateUserStatusByAdmin(
      id,
      executor,
      changeUserStatusDto.status,
      changeUserStatusDto.reason
    );
  }
}