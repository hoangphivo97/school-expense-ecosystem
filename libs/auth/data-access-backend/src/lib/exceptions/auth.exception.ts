import { BaseAuthException } from "@school-expense-ecosystem/shared/utils-backend";

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

export class MissingAppCheckTokenException extends BaseAuthException {
  constructor() {
    super('AUTH_MISSING_APP_CHECK_TOKEN', 'Hold up, what sketchy bot is trying to crash the party? Missing App Check Token!');
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