import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { JoinCodeDialogData, JoinCodeDialogResult } from '@school-expense-ecosystem/projects/types';

@Component({
  selector: 'lib-join-code-dialog',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,],
  templateUrl: './join-code-dialog.component.html',
  styleUrl: './join-code-dialog.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'project' }
  ]
})
export class JoinCodeDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<JoinCodeDialogComponent, JoinCodeDialogResult>);
  readonly data: JoinCodeDialogData = inject(MAT_DIALOG_DATA);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Dynamic visual cues based on context
  readonly contextMeta = computed(() => {
    return this.data.context === 'PROJECT'
      ? { icon: 'folder_special', translocoKey: 'shared.joinDialog.project' }
      : { icon: 'event_available', translocoKey: 'shared.joinDialog.event' };
  });

  readonly joinForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(12)],
    }),
  });

  // Auto uppercase and trim code input
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.toUpperCase().replace(/\s+/g, '');
    this.joinForm.controls.code.setValue(sanitized, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.joinForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const code = this.joinForm.controls.code.value;

    // Delegate API call or return code to parent caller
    this.dialogRef.close({
      success: true,
      context: this.data.context,
      entityId: code,
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false, context: this.data.context });
  }
}
