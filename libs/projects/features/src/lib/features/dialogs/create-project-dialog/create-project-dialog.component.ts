import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  CreateProjectPayload,
  ProjectItem,
  ProjectFundingType,
  ProjectStatus,
  UpdateProjectPayload,
} from '@school-expense-ecosystem/projects/types';
import { ActivityFormLayoutComponent } from '@school-expense-ecosystem/projects/ui';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { ConfirmDialogData, DialogActionEnum, FacultyId, Role } from '@school-expense-ecosystem/shared/types';
import { ConfirmDialogComponent, FormErrorPipe } from '@school-expense-ecosystem/shared/ui';

export interface CreateProjectDialogData {
  facultyId?: FacultyId;
  availableFaculties?: { id: FacultyId; name: string }[];
  action: DialogActionEnum;
  project?: ProjectItem;
}

@Component({
  selector: 'lib-create-project-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    TranslocoModule,
    FormErrorPipe,
    ActivityFormLayoutComponent
  ],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'project' },
    DecimalPipe,
  ],
})
export class CreateProjectDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly dialog = inject(MatDialog);
  private readonly authStore = inject(AuthSignalStore);
  private readonly translocoService = inject(TranslocoService);

  private readonly WARNING_RULES: Partial<Record<Role, Partial<Record<ProjectFundingType, string>>>> = {
    [Role.LEVEL_2_DEAN]: {
      [ProjectFundingType.SCHOOL]: 'createDialog.warnings.deanSchoolApproval',
      [ProjectFundingType.FACULTY]: 'createDialog.warnings.deanFacultyDeduction',
    },
    [Role.LEVEL_3_USER]: {
      [ProjectFundingType.SCHOOL]: 'createDialog.warnings.teacherDualApproval',
      [ProjectFundingType.FACULTY]: 'createDialog.warnings.teacherDeanApproval',
    },
  };

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

  readonly isImmediatelyActive = computed(() => {
    const role = this.authStore.user()?.role;
    const type = this.form?.get('type')?.value as ProjectFundingType;
    if (role === Role.LEVEL_1_FINANCE) return true;
    return type !== ProjectFundingType.SCHOOL;
  });

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
      generateJoinCode: [false],
      maxUses: [null, [Validators.min(1)]],
      expiresAt: [null],
    },
    { validators: [this.validateDateRange, this.validateInitialSpent, this.validateJoinCodeSchedule] }
  );

  constructor() {
    const initialJoinCodeState = Boolean(this.form.get('generateJoinCode')?.value);
    this.updateDialogLayout(initialJoinCodeState);

    this.form.get('generateJoinCode')?.valueChanges.subscribe((enabled: boolean) => {
      this.updateDialogLayout(Boolean(enabled));
      if (enabled) {
        const projectEndDate = this.form.get('endDate')?.value;
        if (projectEndDate && !this.form.get('expiresAt')?.value) {
          this.form.patchValue({ expiresAt: projectEndDate }, { emitEvent: false });
        }
      } else {
        this.form.patchValue({ maxUses: null, expiresAt: null }, { emitEvent: false });
        this.form.get('maxUses')?.setErrors(null);
        this.form.get('expiresAt')?.setErrors(null);
        this.form.updateValueAndValidity();
      }
    });

    this.form.get('endDate')?.valueChanges.subscribe((newEndDate) => {
      if (this.form.get('generateJoinCode')?.value && newEndDate) {
        this.form.patchValue({ expiresAt: newEndDate }, { emitEvent: false });
      }
    });

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
        this.form.disable();
      } else if (this.isEditMode()) {
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

  private validateDateRange(control: AbstractControl): ValidationErrors | null {
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
  }

  private validateJoinCodeSchedule(control: AbstractControl): ValidationErrors | null {
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
  }

  private validateInitialSpent(control: AbstractControl): ValidationErrors | null {
    const budget = Number(control.get('budgetCap')?.value || 0);
    const initial = Number(control.get('initialSpent')?.value || 0);

    if (initial > budget) {
      control.get('initialSpent')?.setErrors({ initialSpentExceedsBudget: true });
      return { initialSpentExceedsBudget: true };
    }
    return null;
  }

  onInputAmount(event: Event, controlName: 'budgetCap' | 'initialSpent'): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitized = inputElement.value.replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
    const control = this.form.get(controlName);

    control?.markAsTouched();

    if (!sanitized || sanitized === '.') {
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

    this.errorMessage.set(null);
    const formValue = this.form.getRawValue();

    if (this.isEditMode() && this.data?.project) {
      this.isSubmitting.set(true);
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

    const isJoinCodeEnabled = Boolean(formValue.generateJoinCode);
    const payload: CreateProjectPayload = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      type: formValue.type,
      facultyId: formValue.facultyId,
      budgetCap: Number(formValue.budgetCap),
      initialSpent: Number(formValue.initialSpent || 0),
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      joinCodeConfig: isJoinCodeEnabled
        ? {
            maxUses: formValue.maxUses ? Number(formValue.maxUses) : undefined,
            expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : undefined,
          }
        : undefined,
    };

    const warningMessage = this.getConfirmationWarning(payload.type);

    if (warningMessage) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: this.translocoService.translate('project.createDialog.warnings.dialogTitle'),
          message: warningMessage,
          confirmText: this.translocoService.translate('project.createDialog.actions.proceed'),
          cancelText: this.translocoService.translate('project.createDialog.actions.review'),
          confirmColor: 'primary',
          icon: 'help_outline',
        } as ConfirmDialogData,
      });

      confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this.executeCreateProject(payload);
        }
      });
      return;
    }

    this.executeCreateProject(payload);
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
        title: this.translocoService.translate('project.createDialog.discardModal.title'),
        message: this.translocoService.translate('project.createDialog.discardModal.message'),
        confirmText: this.translocoService.translate('project.createDialog.discardModal.confirm'),
        cancelText: this.translocoService.translate('project.createDialog.discardModal.cancel'),
        confirmColor: 'warn',
        icon: 'warning',
      } as ConfirmDialogData,
    });

    confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.dialogRef.close();
      }
    });
  }

  private getConfirmationWarning(type: ProjectFundingType): string | null {
    const role = this.authStore.user()?.role;
    if (!role) return null;

    const translationKey = this.WARNING_RULES[role]?.[type];
    return translationKey ? this.translocoService.translate(translationKey, {}, 'project') : null;
  }

  private executeCreateProject(payload: CreateProjectPayload): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

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

  private updateDialogLayout(isExpanded: boolean): void {
    this.dialogRef.updateSize(isExpanded ? '1020px' : '600px');
  }
}