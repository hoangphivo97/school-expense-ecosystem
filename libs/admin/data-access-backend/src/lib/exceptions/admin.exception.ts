export class BaseAdminException extends Error {
  constructor(
    public readonly errorCode: string,
    public override readonly message: string,
    public readonly extraData?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AdminIdentityConflictException extends BaseAdminException {
  constructor() {
    super('ADMIN_IDENTITY_CONFLICT', 'Identity conflict: Email or User Code is already registered.');
  }
}

export class AdminSelfMutationException extends BaseAdminException {
  constructor() {
    super('ADMIN_SELF_MUTATION_VIOLATION', 'Administrative safety policy violation: Self-mutation of operational roles or status within the management pool is strictly prohibited.');
  }
}

export class AdminUserNotFoundException extends BaseAdminException {
  constructor() {
    super('ADMIN_USER_NOT_FOUND', 'Target user record does not exist.');
  }
}

export class AdminPeerProtectionException extends BaseAdminException {
  constructor() {
    super('ADMIN_PEER_PROTECTION_VIOLATION', 'Security violation: Absolute Peer Protection active. Modifying another elite Administrator within this management pool is strictly prohibited.');
  }
}

export class AdminInvalidDeletionStatusException extends BaseAdminException {
  constructor() {
    super('ADMIN_INVALID_DELETION_STATUS', 'Administrative policy violation: Only user accounts with a "Rejected" status are eligible for deletion handling.');
  }
}

export class AdminSecurityThreatException extends BaseAdminException {
  constructor() {
    super('ADMIN_SECURITY_THREAT_RESTRICTION', 'Infrastructural Restriction: Security threat retention must be handled locally on the client layer for this product version.');
  }
}