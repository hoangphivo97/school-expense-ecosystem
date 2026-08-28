import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { ProjectFundingType, ProjectStatus } from "../enums/project.enum";
import { JoinConfig } from "./shared.interface";

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
    joinConfig?: JoinConfig | null;
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
