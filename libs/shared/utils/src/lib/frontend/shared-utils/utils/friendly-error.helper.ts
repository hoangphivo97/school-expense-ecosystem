import { DialogError, ErrorResponse } from "@school-expense-ecosystem/shared/types";

export function getFriendlyErrorMessage(error: any): DialogError {
  // Fallback boundary configuration for null or undefined errors
  if (!error) {
    return {
      statusCode: 500,
      errorCode: 'FE_UNHANDLED_FALLBACK',
      title: 'Unexpected Error',
      errorMsg: 'An unhandled system exception occurred.',
      hint: 'Please try again later.',
    };
  }

  // 🌟 PHASE 1: Process Direct Frontend Firebase Authentication SDK Errors
  if (error.code) {
    const baseFirebasePayload = { statusCode: 400, errorCode: error.code };
    
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return {
          ...baseFirebasePayload,
          title: 'Login Conflict',
          errorMsg: 'An account already exists with the same email but different sign-in credentials.',
          hint: 'Try logging in with the original provider (e.g., Google instead of Facebook).',
        };

      case 'auth/user-disabled':
        return {
          ...baseFirebasePayload,
          statusCode: 403,
          title: 'Account Disabled',
          errorMsg: 'Your account has been disabled.',
          hint: 'Please contact school administration support for more information.',
        };

      case 'auth/invalid-credential':
        return {
          ...baseFirebasePayload,
          statusCode: 401,
          title: 'Authentication Failed',
          errorMsg: 'The credentials provided are invalid or the account lacks access permissions.',
          hint: 'Please verify your details or contact the IT department for support.',
        };

      case 'auth/popup-closed-by-user':
        return {
          ...baseFirebasePayload,
          title: 'Authentication Cancelled',
          errorMsg: 'The secure Google login window was closed before completing the handshake.',
          hint: 'Please click the button again to retry logging in with Google.',
        };

      default:
        return {
          ...baseFirebasePayload,
          title: 'Authentication Error',
          errorMsg: error.message || 'A secure authentication anomaly occurred.',
        };
    }
  }

  // 🌟 PHASE 2: Process Backend NestJS Network HTTP Status Errors (Upgraded!)
  if (error.status !== undefined) {
    const status = error.status;
    const apiError = error.error as Partial<ErrorResponse>;
    const backendCode = apiError?.errorCode || 'SYSTEM_ERROR';

    const baseNetworkPayload = {
      statusCode: status,
      errorCode: backendCode,
      errorMsg: apiError?.errorMsg || error.message || 'An infrastructure anomaly occurred.'
    };

    switch (status) {
      case 400:
        return {
          ...baseNetworkPayload,
          title: 'Validation Failed',
          hint: 'Please review your input fields for typos and retry.',
        };

      case 401:
        return {
          ...baseNetworkPayload,
          title: 'Session Expired',
          hint: 'Please reload the application and log in again to refresh credentials.',
        };

      case 403:
        return {
          ...baseNetworkPayload,
          title: 'Access Forbidden',
          hint: 'Contact the school administrator if you believe this is an error.',
        };

      case 409: {
        switch (backendCode) {
          case 'AUTH_IDENTITY_CONFLICT_CLAIMED':
          case 'ADMIN_IDENTITY_CONFLICT':
            return {
              ...baseNetworkPayload,
              title: 'Identity Conflict',
              errorMsg: apiError?.errorMsg || "This User Code (ID/MSSV) has already been claimed by another active verified system account.",
              hint: 'Please double-check your input code or contact the IT support desk.',
            };

          case 'AUTH_IDENTITY_CONFLICT_EMAIL':
            return {
              ...baseNetworkPayload,
              title: 'Security Violation',
              errorMsg: apiError?.errorMsg || 'This specific organizational User Code is strictly allocated to a different email address structure.',
              hint: 'Ensure you are authenticating with your official university email domain.',
            };

          default:
            return {
              ...baseNetworkPayload,
              title: 'Data Collision',
              hint: 'Please verify your profile configurations and retry your submission.',
            };
        }
      }

      case 500:
        return {
          ...baseNetworkPayload,
          title: 'Internal Server Error',
          hint: 'The incident has been logged. Please notify system developers if this persists.',
        };

      default:
        return {
          ...baseNetworkPayload,
          title: 'Network Infrastructure Error',
          hint: 'Please verify your internet connection status and try again.',
        };
    }
  }

  // General catch-all fallback configuration
  return {
    statusCode: 500,
    errorCode: 'UNKNOWN_OPERATIONAL_ERROR',
    title: 'System Error',
    errorMsg: error.message || 'A non-standard operational error occurred.',
  };
}