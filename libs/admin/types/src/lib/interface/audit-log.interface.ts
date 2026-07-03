import { AdminActionType } from "../enums/audit-log.enum";

export interface IAuditLogChangeValue {
  old: unknown;
  new: unknown;
}

/**
 * Dictionary schema mapping modified property keys to their respective old and new values.
 */
export interface IAuditLogChanges {
  [propertyKey: string]: IAuditLogChangeValue;
}

/**
 * Explicit transactional payload model forced upon the logging ingestion architecture.
 */
export interface IAuditLogInput {
  actorUid: string;     // The 'uid' of the performing administrator
  actorEmail: string;   // Corporate school email tracking reference
  action: AdminActionType;
  targetIds: string[];  // Collection of impacted user document IDs (Supports 1 or many for Bulk)
  changes?: IAuditLogChanges; // Nullable parameter matching the Differential Logging strategy
  reason?: string;
}