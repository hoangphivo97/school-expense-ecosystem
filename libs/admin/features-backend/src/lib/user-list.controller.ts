import { Controller, Get } from '@nestjs/common';
import { UserListService } from './user-list.service';
import { UserBase } from '@school-expense-ecosystem/auth/types';

@Controller('admin/users')
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