import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { ProjectFundingType, ProjectStatus } from "../enums/project.enum";

export interface ProjectJoinConfig {
    code: string;
    maxUses: number;
    usedCount: number;
    startsAt: string;
    expiresAt: string;
    createdAt?: string;
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
    rejectionReason?: string | null;
}

export interface StudentSummary {
    id: string;
    studentCode: string;
    fullName: string;
    email: string;
}
