import { DecimalPipe } from '@angular/common';
import { FormGroup } from '@angular/forms';

export function handleCurrencyInput(
  event: Event,
  controlName: string,
  form: FormGroup,
  decimalPipe: DecimalPipe
): void {
  const inputElement = event.target as HTMLInputElement;
  const sanitized = inputElement.value.replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
  const control = form.get(controlName);

  control?.markAsTouched();

  if (!sanitized || sanitized === '.') {
    control?.setValue(null);
    inputElement.value = '';
    form.updateValueAndValidity();
    return;
  }

  const numericValue = parseFloat(sanitized);
  if (!isNaN(numericValue)) {
    control?.setValue(numericValue);
    inputElement.value = decimalPipe.transform(numericValue, '1.0-2') || '';
  } else {
    control?.setValue(null);
    inputElement.value = '';
  }

  form.updateValueAndValidity();
}