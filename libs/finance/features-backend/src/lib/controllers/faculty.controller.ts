import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FacultyService } from '@school-expense-ecosystem/finance/data-access-backend';
import { JwtAuthGuard, Public } from '@school-expense-ecosystem/shared/guards-backend';
import { Faculty } from '@school-expense-ecosystem/shared/types';

@Controller('faculties')
@UseGuards(JwtAuthGuard)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

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
}