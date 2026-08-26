import { FacultyId } from '../enums/user.enum';

export interface Faculty {
  id: FacultyId;
  name: string;
  deanId?: string;
  isActive: boolean;
}