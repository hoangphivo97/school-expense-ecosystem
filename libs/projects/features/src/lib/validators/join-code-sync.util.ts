import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

export function setupJoinCodeDialogSync(
  form: FormGroup,
  dialogRef: MatDialogRef<unknown>,
  destroyRef: DestroyRef
): void {
  const updateLayout = (isExpanded: boolean) => {
    dialogRef.updateSize(isExpanded ? '1020px' : '600px');
  };

  updateLayout(Boolean(form.get('generateJoinCode')?.value));

  form.get('generateJoinCode')?.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((enabled: boolean) => {
      updateLayout(Boolean(enabled));
      if (enabled) {
        const endDate = form.get('endDate')?.value;
        if (endDate && !form.get('expiresAt')?.value) {
          form.patchValue({ expiresAt: endDate }, { emitEvent: false });
        }
      } else {
        form.patchValue({ maxUses: null, expiresAt: null }, { emitEvent: false });
        form.get('maxUses')?.setErrors(null);
        form.get('expiresAt')?.setErrors(null);
        form.updateValueAndValidity();
      }
    });

  form.get('endDate')?.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((newEndDate) => {
      if (form.get('generateJoinCode')?.value && newEndDate) {
        form.patchValue({ expiresAt: newEndDate }, { emitEvent: false });
      }
    });
}