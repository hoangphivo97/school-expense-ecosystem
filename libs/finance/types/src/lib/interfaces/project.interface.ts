import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { EventScope, EventStatus, ProjectFundingType, ProjectStatus } from "./project.enum";

export interface ProjectJoinConfig {
    code: string;
    maxUses: number;
    usedCount: number;
    expiresAt: Date;
}

export interface Project {
    id: string;
    name: string;
    budgetCap: number;
    currentSpent: number;
    status: ProjectStatus;
    type: ProjectFundingType;
    mentorIds: string;
    deanId?: string;
    joinConfig?: ProjectJoinConfig;
    joinedStudentIds: string[];
    createdAt?: string;
    facultyId: FacultyId;
    startDate: Date;
    endDate: Date;
}

export interface Event {
    id: string;
    name: string;
    status: EventStatus;
    createdAt?: string;
    scope: EventScope;
    startDate: Date;
    endDate: Date;
    facultyId?: FacultyId;
}
