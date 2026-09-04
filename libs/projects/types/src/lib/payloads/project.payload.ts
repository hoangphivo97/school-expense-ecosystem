import { ProjectFundingType, ProjectStatus } from '../enums/project.enum';
import { JoinConfig } from '../models/shared.interface';
import { BaseActivityPayload, BaseActivityQueryPayload } from './shared.payload';

export interface CreateProjectPayload extends BaseActivityPayload<ProjectFundingType> {}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus;
  joinConfig?: JoinConfig | null;
  rejectionReason?: string | null;
}

export interface ProjectQueryPayload extends BaseActivityQueryPayload<ProjectStatus> {
  mentorId?: string;
}

