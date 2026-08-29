export interface GenerateJoinCodePayload {
  maxUses?: number;
  startsAt: string;
  expiresAt: string;
}

export interface JoinByCodePayload {
  code: string;
}

export interface ManageParticipantsPayload {
  userIds: string[];
}