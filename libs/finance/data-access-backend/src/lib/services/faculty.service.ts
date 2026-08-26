import { Injectable, NotFoundException } from '@nestjs/common';
import { Faculty } from '@school-expense-ecosystem/shared/types';
import { FacultyRepository } from '../repositories/abstracts/faculty.repository';


@Injectable()
export class FacultyService {
  constructor(private readonly facultyRepo: FacultyRepository) {}

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
}