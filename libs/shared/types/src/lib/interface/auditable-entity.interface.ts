export interface VersionedEntity {
  id: string;
  version: number;
  updatedAt: string;
}

export interface AuditableEntity extends VersionedEntity {
  createdAt: string;
  createdBy?: string;
  updatedBy?: string;
}