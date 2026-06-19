import { DialogError } from "@school-expense-ecosystem/shared/types";

export function getFriendlyErrorMessage(error: any): DialogError {
  // Fallback boundary configuration for null or undefined errors
  if (!error) {
    return {
      title: 'Unexpected Error',
      errorMsg: 'An unhandled system exception occurred.',
      hint: 'Please try again later.',
    };
  }

  // 🌟 PHASE 1: Process Direct Firebase Authentication SDK Errors
  if (error.code) {
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return {
          title: 'Login Conflict',
          errorMsg: 'An account already exists with the same email but different sign-in credentials.',
          hint: 'Try logging in with the original provider (e.g., Google instead of Facebook).',
        };

      case 'auth/user-disabled':
        return {
          title: 'Account Disabled',
          errorMsg: 'Your account has been disabled.',
          hint: 'Please contact school administration support for more information.',
        };

      case 'auth/invalid-credential':
        return {
          title: 'Authentication Failed',
          errorMsg: 'The credentials provided are invalid or the account lacks access permissions.',
          hint: 'Please verify your details or contact the IT department for support.',
        };

      case 'auth/popup-closed-by-user':
        return {
          title: 'Authentication Cancelled',
          errorMsg: 'The secure Google login window was closed before completing the handshake.',
          hint: 'Please click the button again to retry logging in with Google.',
        };

      default:
        return {
          title: 'Authentication Error',
          errorMsg: error.message || 'A secure authentication anomaly occurred.',
        };
    }
  }

  // 🌟 PHASE 2: Process Backend NestJS Network HTTP Status Errors
  if (error.status !== undefined) {
    const serverMessage: string = error.error?.message || '';

    switch (error.status) {
      case 400:
        return {
          title: 'Validation Failed',
          errorMsg: 'The financial ecosystem rejected the submitted data structure.',
          hint: 'Please review your onboarding input fields for typos and retry.',
        };

      case 401:
        return {
          title: 'Session Expired',
          errorMsg: 'Your active session has expired or your identity token is corrupted.',
          hint: 'Please reload the application and log in again to refresh credentials.',
        };

      case 403:
        return {
          title: 'Access Forbidden',
          errorMsg: 'You do not possess the required structural clearance roles to access this area.',
          hint: 'Contact the school administrator if you believe this is an error.',
        };

      case 409: {
        // Evaluate internal NestJS exception text messages using the switch(true) pattern
        switch (true) {
          case serverMessage.includes('Identity Conflict'):
          case serverMessage.includes('userCode'):
            return {
              title: 'Identity Conflict',
              errorMsg: "This User Code (ID/MSSV) has already been claimed by another active verified system account.",
              hint: 'Please double-check your input code or contact the IT support desk.',
            };

          case serverMessage.includes('Security Violation'):
            return {
              title: 'Security Violation',
              errorMsg: 'This specific organizational User Code is strictly allocated to a different email address structure.',
              hint: 'Ensure you are authenticating with your official university email domain.',
            };

          default:
            return {
              title: 'Data Collision',
              errorMsg: 'A data state collision occurred inside the core processing matrix engine.',
              hint: 'Please verify your profile configurations and retry your submission.',
            };
        }
      }

      case 500:
        return {
          title: 'Internal Server Error',
          errorMsg: 'The core financial matrix engine encountered an internal system-level failure.',
          hint: 'The incident has been logged. Please notify system developers if this persists.',
        };

      default:
        return {
          title: 'Network Infrastructure Error',
          errorMsg: error.message || 'An unhandled infrastructure anomaly occurred.',
          hint: 'Please verify your internet connection status and try again.',
        };
    }
  }

  // General catch-all fallback configuration
  return {
    title: 'System Error',
    errorMsg: error.message || 'A non-standard operational error occurred.',
  };
}