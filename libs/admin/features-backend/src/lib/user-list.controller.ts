import { Controller, Get, UseGuards, Req, Query, Post, Body, Patch, Param } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { JwtAuthGuard, Roles, RolesGuard } from '@school-expense-ecosystem/auth/features-backend';
import { CreateUserDto, UpdateUserDto } from 'admin-data-access-backend';

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
    return this.userListService.provisionNewUserByAdmin(req.user.uid, req.user.email, createUserDto);
  }

  @Patch(':id')
  @Roles(Role.LEVEL_0_ADMIN)
  async updateInstitutionalUser(@Param('id') targetUid: string, @Req() req: { user: UserBase }, @Body() updateUserDto: UpdateUserDto) {
   return this.userListService.updateUserByAdmin(targetUid, req.user.uid, req.user.email, updateUserDto);
  }
}