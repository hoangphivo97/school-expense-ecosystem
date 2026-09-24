import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, maxLength, minLength, required, FormField, transformedValue } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { EventItem, JoinCodeDialogData, JoinCodeDialogResult, ProjectItem } from '@school-expense-ecosystem/projects/types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

interface JoinCodeFormModel {
  code: string;
}

@Component({
  selector: 'lib-join-code-dialog',
  imports: [CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
    FormField],
  templateUrl: './join-code-dialog.component.html',
  styleUrl: './join-code-dialog.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'project' }
  ]
})
export class JoinCodeDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<JoinCodeDialogComponent, JoinCodeDialogResult>>(MatDialogRef);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly eventApiService = inject(EventApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data: JoinCodeDialogData = inject(MAT_DIALOG_DATA);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // 1. Primitive data model signal
  readonly joinModel = signal<JoinCodeFormModel>({ code: '' });

  // 2. FieldTree with declarative schema validators
  readonly joinForm = form(this.joinModel, (schema) => {
    required(schema.code, { message: 'Code is required' });
    minLength(schema.code, 6, { message: 'Code must be at least 6 characters' });
    maxLength(schema.code, 12, { message: 'Code cannot exceed 12 characters' });
  });

  // Dynamic visual cues based on context
  readonly contextMeta = computed(() => {
    return this.data.context === 'PROJECT'
      ? { icon: 'folder_special', translocoKey: 'shared.joinDialog.project' }
      : { icon: 'event_available', translocoKey: 'shared.joinDialog.event' };
  });

  // Sanitize input while mutating FieldTree signal state
  onCodeInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const sanitized = input.value.toUpperCase().replace(/\s+/g, '');
  input.value = sanitized;
  this.joinForm.code().value.set(sanitized);
}

  onSubmit(): void {
    if (this.joinForm().invalid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const code = this.joinModel().code;

    const join$: Observable<ProjectItem | EventItem> = this.data.context === 'PROJECT'
      ? this.projectApiService.joinProjectByCode({ code })
      : this.eventApiService.joinByCode({ code });

    join$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (enrolledActivity) => {
        this.isSubmitting.set(false);
        this.dialogRef.close({
          success: true,
          context: this.data.context,
          entityId: enrolledActivity.id,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const serverError =
          err?.error?.errorMsg ||
          err?.error?.message ||
          'Failed to join activity. Please verify your code.';
        this.errorMessage.set(serverError);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false, context: this.data.context });
  }
}
