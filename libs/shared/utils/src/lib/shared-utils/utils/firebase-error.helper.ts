import { FirebaseError } from 'firebase/app';
import { DialogError } from '@school-expense-ecosystem/shared/types';

export function getFriendlyFirebaseError(error: FirebaseError): DialogError {
  switch (error.code) {
    case 'auth/account-exists-with-different-credential':
      return {
        title: 'Login Conflict',
        errorMsg:
          'An account already exists with the same email but different sign-in credentials.',
        hint: 'Try logging in with the original provider (e.g., Google instead of Facebook).',
      };

    case 'auth/user-disabled':
      return {
        title: 'Account Disabled',
        errorMsg: 'Your account has been disabled.',
        hint: 'Please contact support for more information.',
      };
    default:
      return {
        title: 'Authentication Error',
        errorMsg: error.message,
      };
  }
}
