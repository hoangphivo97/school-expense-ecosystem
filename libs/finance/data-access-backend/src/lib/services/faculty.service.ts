import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser, Faculty, FacultyId, Role } from '@school-expense-ecosystem/shared/types';
import { FacultyRepository } from '../repositories/abstracts/faculty.repository';

export type DepartmentFundBalanceResult =
  | {
      facultyId: FacultyId;
      year: number;
      remainingBudget: number;
    }
  | {
      fundId: string;
      facultyId: FacultyId;
      year: number;
      remainingBudget: number;
      allocatedBudget: number;
      totalBudget: number;
    };

@Injectable()
export class FacultyService {
  constructor(private readonly facultyRepo: FacultyRepository) { }

  async getAllActiveFaculties(): Promise<Faculty[]> {
    return this.facultyRepo.findAllActive();
  }

  async getFacultyById(facultyId: string): Promise<Faculty> {
    const faculty = await this.facultyRepo.findById(facultyId);
    if (!faculty) {
      throw new NotFoundException(`Faculty with identifier ${facultyId} not found`);
    }
    return faculty;
  }

async getDepartmentFundBalance(
    facultyId: FacultyId,
    user: AuthenticatedUser,
    year?: number
  ): Promise<DepartmentFundBalanceResult> {
    await this.getFacultyById(facultyId);

    const targetYear = year && !isNaN(year) ? Number(year) : new Date().getFullYear();
    const departmentFundId = `${facultyId.toUpperCase()}_DEPT_${targetYear}`;

    const fund = await this.facultyRepo.getDepartmentFund(facultyId, targetYear);

    if (!fund) {
      throw new NotFoundException(`Department fund "${departmentFundId}" was not found.`);
    }

    if (user.role === Role.LEVEL_3_USER) {
      if (user.facultyId !== facultyId) {
        throw new ForbiddenException('You can only view fund balance for your own department.');
      }

      return {
        facultyId: fund.facultyId,
        year: fund.year,
        remainingBudget: fund.remainingBudget,
      };
    }

    return fund;
  }
}