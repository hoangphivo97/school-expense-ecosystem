import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { JwtAuthGuard, Roles, RolesGuard } from '@school-expense-ecosystem/backend/auth/features'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEVEL_0_ADMIN)
export class UserListController {
  constructor(private readonly userListService: UserListService) {}

  /**
   * REST ENDPOINT: GET /api/admin/users
   * Pulls the latest user roster directly from Firestore
   */
  @Get()
  async getAllUsers(): Promise<UserBase[]> {
    return this.userListService.findAllUsers();
  }
}