import { CursorPaginationParams } from "@school-expense-ecosystem/shared/types";
import { ProjectFundingType, ProjectStatus } from "../enums/project.enum";
import { BaseActivityItem } from "./shared.interface";

export interface ProjectItem extends BaseActivityItem<ProjectFundingType, ProjectStatus> {
  mentorId: string;
}

export interface FilterProjectParams {
  facultyId?: string;
  status?: ProjectStatus;
  type?: ProjectFundingType;
  mentorId?: string;
  studentId?: string;
  search?: string;
}

export interface PaginatedProjectResult {
  items: ProjectItem[];
  nextPageToken: string | null;
  totalItems: number;
}
