import { Pipe, PipeTransform } from '@angular/core';

interface SignalValidationError {
  readonly kind: string;
  readonly message?: string;
}

@Pipe({
  name: 'formErrorSignal',
})
export class FormErrorSignalPipe implements PipeTransform {
  transform(
    errors: SignalValidationError[] | null | undefined,
    customMessages?: Record<string, string>
  ): string {
    // Immediate escape hatch if no errors exist within the signal stream
    if (!errors || errors.length === 0) return '';

    // Signal Forms architecture evaluates errors as an ordered array. Target the primary constraint.
    const firstError = errors[0];
    const errorKind = firstError.kind;

    // 1. Structural Layer 1: Enforce explicit HTML template level token dictionary overrides
    if (customMessages && customMessages[errorKind]) {
      return customMessages[errorKind];
    }

    // 2. Structural Layer 2: Extract explicit error messaging declared inside the schema definition setup
    if (firstError.message) {
      return firstError.message;
    }

    // 3. Structural Layer 3: System-wide default fallback values for common validation identifiers
    const globalFallbacks: Record<string, string> = {
      required: 'This field requires a valid non-empty value.',
      email: 'The provided input format does not match a valid email structure.',
      pattern: 'Input layout configuration constraints violated.'
    };

    return globalFallbacks[errorKind] || 'Field context failed operational validation requirements.';
  }
}
