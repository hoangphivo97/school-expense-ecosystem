export interface JoinConfig {
  code: string;
  isActive: boolean;
  maxUses?: number;
  usedCount?: number;
  startsAt?: string;   // ISO 8601
  expiresAt?: string;  // ISO 8601
  createdAt: string;   // ISO 8601
}