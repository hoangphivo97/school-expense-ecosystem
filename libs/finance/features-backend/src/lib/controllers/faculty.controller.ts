import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FacultyService } from '@school-expense-ecosystem/finance/data-access-backend';
import { CurrentUser, JwtAuthGuard, Public, Roles, UserTypes } from '@school-expense-ecosystem/shared/guards-backend';
import { AuthenticatedUser, Faculty, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';

@Controller('faculties')
@UseGuards(JwtAuthGuard)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) { }

  /**
   * Retrieve all active faculties (Publicly accessible for Onboarding & Filters)
   */
  @Get()
  @Public()
  async getFaculties(): Promise<Faculty[]> {
    return this.facultyService.getAllActiveFaculties();
  }

  /**
   * Retrieve details of a specific faculty
   */
  @Get(':id')
  @Public()
  async getFacultyById(@Param('id') id: string): Promise<Faculty> {
    return this.facultyService.getFacultyById(id);
  }

  @Get(':id/fund-balance')
  @Roles(Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER)
  @UserTypes(UserType.TEACHER)
  async getDepartmentFundBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('year') year?: string
  ) {
    const parsedYear = year ? parseInt(year, 10) : undefined;
    return this.facultyService.getDepartmentFundBalance(
      id.toUpperCase() as FacultyId,
      user,
      parsedYear
    );
  }
}