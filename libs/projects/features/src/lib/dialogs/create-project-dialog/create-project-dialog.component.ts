import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { ConfirmDialogData, DepartmentFundSummary, DialogActionEnum, FacultyId, Role } from '@school-expense-ecosystem/shared/types';
import { ConfirmDialogComponent, FormErrorPipe } from '@school-expense-ecosystem/shared/ui';
import { departmentBudgetLimitValidator } from '../../validators/department-budget.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trackLoading } from '@school-expense-ecosystem/shared/utils-frontend';
import { catchError, merge, of, switchMap } from 'rxjs';
import { validateDateRange, validateInitialSpent, validateJoinCodeSchedule } from '../../validators/activity-form.validators';
import { setupJoinCodeDialogSync } from '../../validators/join-code-sync.util';
import { handleCurrencyInput } from '../../validators/currency-input.util';

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
  private readonly destroyRef = inject(DestroyRef);

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
  readonly departmentFund = signal<DepartmentFundSummary | null>(null);
  readonly isFundLoading = signal<boolean>(false);

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
      budgetCap: [0, [Validators.required, Validators.min(1),
      departmentBudgetLimitValidator({
        getRemainingBudget: () => this.departmentFund()?.remainingBudget,
        isFacultyFunding: () => this.form?.get('type')?.value === ProjectFundingType.FACULTY,
      }),
      ]],
      initialSpent: [0, [Validators.min(0)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [null, [Validators.required]],
      generateJoinCode: [false],
      maxUses: [null, [Validators.min(1)]],
      expiresAt: [null],
    },
    { validators: [validateDateRange, validateInitialSpent, validateJoinCodeSchedule] }
  );

  constructor() {
    const typeControl = this.form.get('type');
    const facultyControl = this.form.get('facultyId');

    if (typeControl && facultyControl) {
      merge(typeControl.valueChanges, facultyControl.valueChanges)
        .pipe(
          switchMap(() => {
            if (this.isDetailMode()) return of(null);

            const type = typeControl.value as ProjectFundingType;
            const facultyId = facultyControl.value as FacultyId;

            // Reset balance if conditions are not met
            if (type !== ProjectFundingType.FACULTY || !facultyId) {
              return of(null);
            }

            // switchMap automatically cancels any pending in-flight request when a new selection occurs
            return this.facultyApiService.getDepartmentFundBalance(facultyId).pipe(
              trackLoading(this.isFundLoading),
              catchError(() => of(null))
            );
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((fund) => {
          this.departmentFund.set(fund);
          // Instant sync validation evaluation
          this.form.get('budgetCap')?.updateValueAndValidity();
        });
    }

    setupJoinCodeDialogSync(this.form, this.dialogRef, this.destroyRef);

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

  onInputAmount(event: Event, controlName: 'budgetCap' | 'initialSpent'): void {
    handleCurrencyInput(event, controlName, this.form, this.decimalPipe)
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pending || this.isSubmitting()) return;

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
        expectedUpdatedAt: this.data.project.updatedAt,
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
      }
    });
  }
}