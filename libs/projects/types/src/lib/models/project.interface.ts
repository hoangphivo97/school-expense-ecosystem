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
    description?: string | null;
    type: ProjectFundingType;
    budgetCap: number;
    initialSpent: number;
    currentSpent: number;
    pendingSpent: number;
    status: ProjectStatus;
    facultyId: FacultyId;
    mentorId: string;
    startDate: string;
    endDate: string;
    joinConfig?: ProjectJoinConfig | null;
    joinedStudentIds: string[];
    createdAt?: string;
    updatedAt?: string;
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
