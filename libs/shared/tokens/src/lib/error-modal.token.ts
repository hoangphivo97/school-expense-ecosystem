// libs/shared/tokens/src/lib/error-modal.token.ts
import { InjectionToken } from '@angular/core';
import { DialogError } from '@school-expense-ecosystem/shared/types';

export const HTTP_ERROR_DELEGATE = new InjectionToken<(config: DialogError) => void>(
  'HTTP_ERROR_DELEGATE'
);