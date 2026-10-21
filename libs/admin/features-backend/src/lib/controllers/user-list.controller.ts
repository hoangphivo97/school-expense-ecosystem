import { Controller, Get, UseGuards, Req, Query, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserListBackendService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/shared/types';
import { JwtAuthGuard, RolesGuard, Roles } from '@school-expense-ecosystem/shared/guards-backend';
import { ChangeUserStatusDto, CreateUserDto, DeleteUserDto, UpdateUserDto } from '@school-expense-ecosystem/admin/data-access-backend';
import { IAdminExecutor, UserQueryPayload } from '@school-expense-ecosystem/admin/types';
import { ActiveAdmin } from './decorators/admin-executor.decorator';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEVEL_0_ADMIN, Role.LEVEL_2_DEAN)
export class UserListController {
  constructor(private readonly userListService: UserListBackendService) { }

  @Get()
  async getManagedUsers(
    @Req() req: { user: UserBase },
    @Query() query: UserQueryPayload
  ) {
    const requester: UserBase = req.user;

    return this.userListService.getUsersForManagement(requester, query);
  }

  @Post('provision')
  @Roles(Role.LEVEL_0_ADMIN)
  async manualAccountProvisioning(
    @Body() createUserDto: CreateUserDto,
    @ActiveAdmin() executor: IAdminExecutor) {
    return this.userListService.provisionNewUserByAdmin(executor, createUserDto);
  }

  @Patch(':id')
  @Roles(Role.LEVEL_0_ADMIN)
  async updateUser(
    @Param('id') id: string,
    @ActiveAdmin() executor: IAdminExecutor,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userListService.updateUserByAdmin(id, executor, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(Role.LEVEL_0_ADMIN)
  async changeUserStatus(
    @Param('id') id: string,
    @ActiveAdmin() executor: IAdminExecutor,
    @Body() changeUserStatusDto: ChangeUserStatusDto
  ) {

    return this.userListService.updateUserStatusByAdmin(
      id,
      executor,
      changeUserStatusDto.status,
      changeUserStatusDto.reason
    );
  }

  @Delete(':id')
  @Roles(Role.LEVEL_0_ADMIN)
  async executeUserDeletion(
    @Param('id') id: string,
    @ActiveAdmin() executor: IAdminExecutor,
    @Body() deleteUserDto: DeleteUserDto
  ) {

    return this.userListService.deleteUserByAdmin(id, executor, deleteUserDto);
  }
}