import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const validateDateRange: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      return { invalidDateRange: true };
    }
  }
  return null;
};

export const validateJoinCodeSchedule: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const generateCode = control.get('generateJoinCode')?.value;
  if (!generateCode) return null;

  const expiresAtVal = control.get('expiresAt')?.value;
  const endDateVal = control.get('endDate')?.value;

  if (expiresAtVal && endDateVal) {
    const expiresAt = new Date(expiresAtVal);
    const endDate = new Date(endDateVal);
    expiresAt.setHours(23, 59, 59, 999);
    endDate.setHours(23, 59, 59, 999);

    if (expiresAt > endDate) {
      return { invalidJoinCodeExpiration: true };
    }
  }
  return null;
};

export const validateInitialSpent: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const budget = Number(control.get('budgetCap')?.value || 0);
  const initial = Number(control.get('initialSpent')?.value || 0);

  if (initial > budget) {
    control.get('initialSpent')?.setErrors({ initialSpentExceedsBudget: true });
    return { initialSpentExceedsBudget: true };
  }
  return null;
};