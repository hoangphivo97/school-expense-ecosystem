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

export class InvalidCredentialsException extends BaseAuthException {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', 'Authentication failed: Invalid credentials or the target identity context was not found.');
  }
}

export class UserContextNotFoundException extends BaseAuthException {
  constructor() {
    super('AUTH_USER_CONTEXT_NOT_FOUND', 'Access denied: Unable to resolve authenticated session context details.');
  }
}

export class InsufficientPermissionsException extends BaseAuthException {
  constructor() {
    super('AUTH_INSUFFICIENT_PERMISSIONS', 'Access denied: Your account scope does not possess the required security clearances.');
  }
}

export class MissingAppCheckTokenException extends BaseAuthException {
  constructor() {
    super('AUTH_MISSING_APP_CHECK_TOKEN', 'Hold up, what sketchy bot is trying to crash the party? Missing App Check Token!');
  }
}

export class InvalidAppCheckTokenException extends BaseAuthException {
  constructor() {
    super('AUTH_INVALID_APP_CHECK_TOKEN', 'That token is either a fake or ancient history! Access denied!');
  }
}

export class DemoReadOnlyException extends BaseAuthException {
  constructor() {
    super(
      'AUTH_DEMO_READ_ONLY',
      'Demo Mode: Data mutation is disabled in this evaluation sandbox to preserve live database integrity.'
    );
  }
}

export class RateLimitExceededException extends BaseAuthException {
  constructor() {
    super(
      'API_RATE_LIMIT_EXCEEDED',
      "Whoa, slow down turbo! You're clicking faster than a sweatlord in an RPG raid. Chill for a minute!"
    );
  }
}