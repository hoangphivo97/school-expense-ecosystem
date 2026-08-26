import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule, MatHint } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { CreateProjectPayload, Project, ProjectFundingType, ProjectStatus, UpdateProjectPayload } from '@school-expense-ecosystem/projects/types';
import { FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { ConfirmDialogData, DialogActionEnum, FacultyId } from '@school-expense-ecosystem/shared/types';
import { ConfirmDialogComponent, FormErrorPipe } from '@school-expense-ecosystem/shared/ui';

export interface CreateProjectDialogData {
  facultyId?: FacultyId;
  availableFaculties?: { id: FacultyId; name: string }[];
  action: DialogActionEnum
  project?: Project;
}

@Component({
  selector: 'lib-create-project-dialog',
  imports: [MatDialogModule, MatIconModule, MatHint, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule, MatButtonModule, TranslocoModule, FormErrorPipe],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'project' },
    DecimalPipe
  ],
})
export class CreateProjectDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly dialog = inject(MatDialog);

  readonly data = inject<CreateProjectDialogData>(MAT_DIALOG_DATA, { optional: true });
  readonly action = signal<DialogActionEnum>(this.data?.action ?? DialogActionEnum.Create);
  readonly isDetailMode = computed(() => this.action() === DialogActionEnum.Detail);
  readonly isEditMode = computed(() => this.action() === DialogActionEnum.Edit);

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
      budgetCap: [0, [Validators.required, Validators.min(1)]],
      initialSpent: [0, [Validators.min(0)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [null, [Validators.required]],
    },
    { validators: [this.validateDateRange, this.validateInitialSpent] }
  );

  constructor() {
    if (this.data?.project) {
      const project = this.data.project;
      this.form.patchValue({
        name: project.name,
        description: project.description ?? '',
        type: project.type,
        facultyId: project.facultyId,
        budgetCap: project.budgetCap,
        initialSpent: project.initialSpent,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
      });

      if (this.isDetailMode()) {
        // Read-only inspection mode: lock entire form
        this.form.disable();
      } else if (this.isEditMode()) {
        // When active, freeze financial allocations, faculty assignment, and baseline start date
        if (project.status === ProjectStatus.ACTIVE) {
          this.form.get('type')?.disable();
          this.form.get('facultyId')?.disable();
          this.form.get('budgetCap')?.disable();
          this.form.get('initialSpent')?.disable();
          this.form.get('startDate')?.disable();
        }
      }
    }
  }

  // Custom Validator: Ensure startDate <= endDate
  private validateDateRange(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const end = control.get('endDate')?.value;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Set to midnight to compare purely on date boundaries
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (startDate > endDate) {
        return { invalidDateRange: true };
      }
    }
    return null;
  }

  // Custom Validator: Ensure initialSpent <= budgetCap
  private validateInitialSpent(control: AbstractControl): ValidationErrors | null {
    const budgetControl = control.get('budgetCap');
    const initialControl = control.get('initialSpent');

    const budget = Number(budgetControl?.value || 0);
    const initial = Number(initialControl?.value || 0);

    if (initial > budget) {
      initialControl?.setErrors({ ...initialControl.errors, initialSpentExceedsBudget: true });
      return { initialSpentExceedsBudget: true };
    } else if (initialControl?.hasError('initialSpentExceedsBudget')) {
      const errors = { ...initialControl.errors };
      delete errors['initialSpentExceedsBudget'];
      initialControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    return null;
  }

  onInputAmount(event: Event, controlName: 'budgetCap' | 'initialSpent'): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitized = inputElement.value.replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
    const control = this.form.get(controlName);

    control?.markAsTouched();

    if (sanitized === '' || sanitized === '.') {
      control?.setValue(null);
      inputElement.value = '';
      this.form.updateValueAndValidity();
      return;
    }

    const numericValue = parseFloat(sanitized);
    if (!isNaN(numericValue)) {
      control?.setValue(numericValue);
      inputElement.value = this.decimalPipe.transform(numericValue, '1.0-2') || '';
    } else {
      control?.setValue(null);
      inputElement.value = '';
    }

    this.form.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Using getRawValue() ensures values from disabled controls are still captured
    const formValue = this.form.getRawValue();

    // 1. Branch Execution: Edit Project Flow
    if (this.isEditMode() && this.data?.project) {
      const updatePayload: UpdateProjectPayload = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || null,
        type: formValue.type,
        facultyId: formValue.facultyId,
        budgetCap: Number(formValue.budgetCap),
        initialSpent: Number(formValue.initialSpent || 0),
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString(),
      };

      this.projectApiService.updateProject(this.data.project.id, updatePayload).subscribe({
        next: (updatedProject) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(updatedProject);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to update project.');
        },
      });
      return;
    }

    // 2. Branch Execution: Create Project Flow
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
    if (this.isDetailMode() || this.form.pristine) {
      this.dialogRef.close();
      return;
    }
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Discard Changes',
        message: 'You have unsaved changes in this project. Are you sure you want to discard them?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        confirmColor: 'warn',
        icon: 'warning'
      } as ConfirmDialogData
    });

    confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.dialogRef.close();
      }
    });
  }
}
