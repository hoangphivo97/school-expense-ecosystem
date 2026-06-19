export enum AdminActionType {
  USER_CREATE = 'USER_CREATE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  BULK_ACTIVATE_USERS = 'BULK_ACTIVATE_USERS',
  BULK_DEACTIVATE_USERS = 'BULK_DEACTIVATE_USERS',
  ROLE_CHANGE = 'ROLE_CHANGE',
  FACULTY_ASSIGNMENT_CHANGE = 'FACULTY_ASSIGNMENT_CHANGE'
}

export interface IAuditLogChangeValue {
  old: any;
  new: any;
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
}