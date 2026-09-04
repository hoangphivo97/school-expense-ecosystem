import { ProjectFundingType, ProjectStatus } from "../enums/project.enum";
import { BaseActivityItem } from "./shared.interface";

export interface ProjectItem extends BaseActivityItem<ProjectFundingType, ProjectStatus> {
  mentorId: string;
}
