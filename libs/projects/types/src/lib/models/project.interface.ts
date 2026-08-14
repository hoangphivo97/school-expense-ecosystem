import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { EventScope, EventStatus, ProjectFundingType, ProjectStatus } from "../enums/project.enum";

export interface ProjectJoinConfig {
    code: string;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
}

export interface Project {
  id: string;
  name: string;
  budgetCap: number;
  initialSpent: number;
  currentSpent: number;
  status: ProjectStatus;
  facultyId: FacultyId;
  mentorId: string;

  initialSpentReason?: string;
  initialSpentProofUrls?: string[];
  
  deanId?: string;            
  deanApprovedAt?: string;
  
  financeOfficerId?: string;  
  financeApprovedAt?: string;
  auditNotes?: string;        
  
  startDate: string;
  endDate: string;
  joinedStudentIds: string[];
}

export interface Event {
    id: string;
    name: string;
    status: EventStatus;
    createdAt?: string;
    scope: EventScope;
    startDate: string;
    endDate: string;
    facultyId?: FacultyId;
}
