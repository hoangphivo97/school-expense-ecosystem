import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface DepartmentBudgetValidationOptions {
  getRemainingBudget: () => number | null | undefined;
  isFacultyFunding: () => boolean;
}

/**
 * Universal synchronous validator enforcing departmental budget caps across Projects and Events.
 */
export function departmentBudgetLimitValidator(
  options: DepartmentBudgetValidationOptions
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Skip quota checks if the funding type is not department-backed
    if (!options.isFacultyFunding()) {
      return null;
    }

    const remaining = options.getRemainingBudget();
    const requested = Number(control.value || 0);

    // Trigger validation error when requested allocation exceeds available pool
    if (remaining !== null && remaining !== undefined && requested > remaining) {
      return {
        insufficientDepartmentBudget: {
          available: remaining,
          requested,
        },
      };
    }

    return null;
  };
}