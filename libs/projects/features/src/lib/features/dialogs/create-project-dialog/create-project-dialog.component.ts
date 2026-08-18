import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule, MatHint } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { CreateProjectPayload, ProjectFundingType } from '@school-expense-ecosystem/projects/types';
import { FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

export interface CreateProjectDialogData {
  facultyId?: FacultyId;
  availableFaculties?: { id: FacultyId; name: string }[];
}

@Component({
  selector: 'lib-create-project-dialog',
  imports: [MatDialogModule, MatIconModule, MatHint, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule, MatButtonModule],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'admin' }
  ],
})
export class CreateProjectDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly facultyApiService = inject(FacultyApiService);

  readonly data = inject<CreateProjectDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly fundingTypes = Object.values(ProjectFundingType);
  readonly faculties = computed(
    () => this.data?.availableFaculties ?? this.facultyApiService.facultiesResource.value()
  );

  readonly isFacultiesLoading = this.facultyApiService.facultiesResource.isLoading;

  readonly form: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(500)]],
      type: [ProjectFundingType.SCHOOL, [Validators.required]],
      facultyId: [this.data?.facultyId ?? FacultyId.FIT, [Validators.required]],
      budgetCap: [null, [Validators.required, Validators.min(1)]],
      initialSpent: [0, [Validators.min(0)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [null, [Validators.required]],
    },
    { validators: [this.validateDateRange, this.validateInitialSpent] }
  );

  // Custom Validator: Ensure startDate <= endDate
  private validateDateRange(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const end = control.get('endDate')?.value;
    if (start && end && new Date(start) > new Date(end)) {
      return { invalidDateRange: true };
    }
    return null;
  }

  // Custom Validator: Ensure initialSpent <= budgetCap
  private validateInitialSpent(control: AbstractControl): ValidationErrors | null {
    const budget = Number(control.get('budgetCap')?.value || 0);
    const initial = Number(control.get('initialSpent')?.value || 0);
    if (budget > 0 && initial > budget) {
      return { initialSpentExceedsBudget: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.form.getRawValue();
    const payload: CreateProjectPayload = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      type: formValue.type,
      facultyId: formValue.facultyId,
      budgetCap: Number(formValue.budgetCap),
      initialSpent: Number(formValue.initialSpent || 0),
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
    };

    this.projectApiService.createProject(payload).subscribe({
      next: (createdProject) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(createdProject);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to initialize project. Please try again.');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
