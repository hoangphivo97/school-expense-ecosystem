import { BaseAuthException } from "@school-expense-ecosystem/shared/utils";

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

export class AccountRestrictedException extends BaseAuthException {
  constructor(userStatus: string, reason?: string, customMessage?: string) {
    super('AUTH_ACCOUNT_RESTRICTED', customMessage ?? 'Access denied: Account scope restriction.', {
      userStatus,
      reason: reason ?? "Access restricted by the institution administrator due to policy compliance.",
    });
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