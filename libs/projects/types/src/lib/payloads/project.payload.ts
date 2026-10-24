import { ProjectFundingType, ProjectStatus } from '../enums/project.enum';
import { BaseActivityPayload, BaseActivityQueryPayload, BaseUpdateActivityPayload, RejectActivityPayload } from './shared.payload';

export interface CreateProjectPayload extends BaseActivityPayload<ProjectFundingType> {
  mentorId?: string;
}

export interface UpdateProjectPayload extends BaseUpdateActivityPayload<ProjectFundingType> {
  status?: ProjectStatus;
}

export interface ProjectQueryPayload extends BaseActivityQueryPayload<ProjectStatus, ProjectFundingType> {
  mentorId?: string;
}

// 4. Reject: Rejection payload alias (matches RejectProjectDto)
export type RejectProjectPayload = RejectActivityPayload;