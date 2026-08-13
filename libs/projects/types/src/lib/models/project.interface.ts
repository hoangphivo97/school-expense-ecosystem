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
    currentSpent: number;
    status: ProjectStatus;
    type: ProjectFundingType;
    mentorId: string;
    deanId?: string;
    joinConfig?: ProjectJoinConfig;
    joinedStudentIds: string[];
    createdAt?: string;
    facultyId: FacultyId;
    startDate: string;
    endDate: string;
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
