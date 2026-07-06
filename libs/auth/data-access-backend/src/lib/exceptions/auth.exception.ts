export class BaseAuthException extends Error {
  constructor(
    public readonly errorCode: string,
    public override readonly message: string,
    public readonly extraData?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountRestrictedException extends BaseAuthException {
  constructor(userStatus: string, reason?: string, customMessage?: string) {
    super('AUTH_ACCOUNT_RESTRICTED', customMessage ?? 'Access denied: Account scope restriction.',
      {
        userStatus,
        reason: reason ?? "Access restricted by the institution administrator due to policy compliance.",
      });
  }
}

export class InvalidTokenException extends BaseAuthException {
  constructor() {
    super('AUTH_INVALID_TOKEN', 'Authentication failed: Token is invalid or expired.');
  }
}

export class IdentityConflictEmailException extends BaseAuthException {
  constructor(userCode: string) {
    super('AUTH_IDENTITY_CONFLICT_EMAIL', `Security Violation: User Code '${userCode}' mismatch.`, { userCode });
  }
}

export class IdentityConflictClaimedException extends BaseAuthException {
  constructor(userCode: string) {
    super('AUTH_IDENTITY_CONFLICT_CLAIMED', `Identity Conflict: User Code '${userCode}' already claimed.`, { userCode });
  }
}

export class UserNotFoundException extends BaseAuthException {
  constructor() {
    super('AUTH_USER_NOT_FOUND', 'User record could not be retrieved after onboarding.');
  }
}