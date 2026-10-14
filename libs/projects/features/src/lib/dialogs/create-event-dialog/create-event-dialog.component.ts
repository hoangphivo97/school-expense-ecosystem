import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  CreateEventPayload,
  EventFundingType,
  EventItem,
  EventStatus,
  ProjectItem,
  ProjectStatus,
  UpdateEventPayload,
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
import { handleCurrencyInput } from '../../validators/currency-input.util';
import { setupJoinCodeDialogSync } from '../../validators/join-code-sync.util';

export interface CreateEventDialogData {
  facultyId?: FacultyId;
  availableFaculties?: { id: FacultyId; name: string }[];
  action: DialogActionEnum;
  event?: EventItem;
}

@Component({
  selector: 'lib-create-event-dialog',
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
    ActivityFormLayoutComponent,
    DecimalPipe
  ],
  templateUrl: './create-event-dialog.component.html',
  styleUrl: './create-event-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'event' },
    DecimalPipe,
  ],
})
export class CreateEventDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateEventDialogComponent>);
  private readonly eventApiService = inject(EventApiService);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly dialog = inject(MatDialog);
  private readonly authStore = inject(AuthSignalStore);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly WARNING_RULES: Partial<Record<Role, Partial<Record<EventFundingType, string>>>> = {
    [Role.LEVEL_2_DEAN]: {
      [EventFundingType.SCHOOL]: 'createDialog.warnings.deanSchoolApproval',
      [EventFundingType.FACULTY]: 'createDialog.warnings.deanFacultyDeduction',
    },
    [Role.LEVEL_3_USER]: {
      [EventFundingType.SCHOOL]: 'createDialog.warnings.teacherDualApproval',
      [EventFundingType.FACULTY]: 'createDialog.warnings.teacherDeanApproval',
    },
  };

  readonly data = inject<CreateEventDialogData>(MAT_DIALOG_DATA, { optional: true });
  readonly action = signal<DialogActionEnum>(this.data?.action ?? DialogActionEnum.Create);
  readonly isDetailMode = computed(() => this.action() === DialogActionEnum.Detail);
  readonly isEditMode = computed(() => this.action() === DialogActionEnum.Edit);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly fundingTypes = Object.values(EventFundingType);
  readonly faculties = computed(
    () => this.data?.availableFaculties ?? this.facultyApiService.facultiesResource.value()
  );
  readonly isFacultiesLoading = this.facultyApiService.facultiesResource.isLoading;

  // Track active projects eligible to fund sub-events
  readonly selectedFacultyId = signal<FacultyId>(this.data?.facultyId ?? FacultyId.FIT);
  readonly activeProjectsQuery = computed(() => ({
    facultyId: this.selectedFacultyId(),
    status: ProjectStatus.ACTIVE,
    limit: 100,
  }));
  readonly activeProjectsResource = this.projectApiService.getProjectsResource(this.activeProjectsQuery);
  readonly availableProjects = computed<ProjectItem[]>(() => this.activeProjectsResource.value()?.items ?? []);
  readonly isProjectsLoading = this.activeProjectsResource.isLoading;

  readonly selectedFundingType = signal<EventFundingType>(EventFundingType.SCHOOL);
  readonly isProjectFunded = computed(() => this.selectedFundingType() === EventFundingType.PROJECT);

  readonly departmentFund = signal<DepartmentFundSummary | null>(null);
  readonly isFundLoading = signal<boolean>(false);

  readonly isImmediatelyActive = computed(() => {
    const role = this.authStore.user()?.role;
    const type = this.selectedFundingType();
    if (type === EventFundingType.PROJECT || role === Role.LEVEL_1_FINANCE) return true;
    return type !== EventFundingType.SCHOOL;
  });

  readonly form: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(500)]],
      type: [EventFundingType.SCHOOL, [Validators.required]],
      projectId: [null],
      facultyId: [this.data?.facultyId ?? FacultyId.FIT, [Validators.required]],
      budgetCap: [0, [Validators.required, Validators.min(1),
      departmentBudgetLimitValidator({
        getRemainingBudget: () => this.departmentFund()?.remainingBudget,
        isFacultyFunding: () => this.form?.get('type')?.value === EventFundingType.FACULTY,
      }),
      ]],
      initialSpent: [0, [Validators.min(0)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [null, [Validators.required]],
      generateJoinCode: [false],
      maxUses: [null, [Validators.min(1)]],
      expiresAt: [null],
    },
    {
      validators: [
        validateDateRange,
        validateInitialSpent,
        validateJoinCodeSchedule,
        (control) => this.validateParentProjectBudget(control),
      ],
    }
  );

  constructor() {
    const typeControl = this.form.get('type');
    const facultyControl = this.form.get('facultyId');

    if (typeControl && facultyControl) {
      merge(typeControl.valueChanges, facultyControl.valueChanges)
        .pipe(
          switchMap(() => {
            if (this.isDetailMode()) return of(null);

            const type = typeControl.value as EventFundingType;
            const facultyId = facultyControl.value as FacultyId;

            // Reset balance if conditions are not met
            if (type !== EventFundingType.FACULTY || !facultyId) {
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

    // Handle funding type modifications
    this.form.get('facultyId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((facId: FacultyId) => {
        this.selectedFacultyId.set(facId);
        this.form.get('projectId')?.setValue(null);
      });

    // Auto-sync join code layout and defaults
    this.form.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type: EventFundingType) => {
        this.selectedFundingType.set(type);
        const projectControl = this.form.get('projectId');
        if (type === EventFundingType.PROJECT) {
          projectControl?.setValidators([Validators.required]);
        } else {
          projectControl?.clearValidators();
          projectControl?.setValue(null);
        }
        projectControl?.updateValueAndValidity();
      });

    if (this.data?.event) {
      this.patchExistingData(this.data.event);
    }
  }

  private patchExistingData(event: EventItem): void {
    this.selectedFundingType.set(event.type);
    this.selectedFacultyId.set(event.facultyId);

    this.form.patchValue({
      name: event.name,
      description: event.description ?? '',
      type: event.type,
      projectId: event.projectId ?? null,
      facultyId: event.facultyId,
      budgetCap: event.budgetCap,
      initialSpent: event.initialSpent,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    });

    if (this.isDetailMode()) {
      this.form.disable();
    } else if (this.isEditMode()) {
      if (event.status === EventStatus.UPCOMING || event.status === EventStatus.ONGOING) {
        this.form.get('type')?.disable();
        this.form.get('projectId')?.disable();
        this.form.get('facultyId')?.disable();
        this.form.get('budgetCap')?.disable();
        this.form.get('initialSpent')?.disable();
        this.form.get('startDate')?.disable();
      }
    }
  }

  private validateParentProjectBudget(control: AbstractControl): ValidationErrors | null {
    const parentProjectId = control.get('projectId')?.value;
    const budgetCap = Number(control.get('budgetCap')?.value || 0);

    // Validate headroom whenever a parent project is linked
    if (!parentProjectId) {
      return null;
    }

    const parentProject = this.availableProjects().find((p) => p.id === parentProjectId);
    if (!parentProject) return null;

    const availableBudget =
      parentProject.budgetCap - (parentProject.currentSpent + (parentProject.pendingSpent ?? 0));

    if (budgetCap > availableBudget) {
      control.get('budgetCap')?.setErrors({ parentBudgetExceeded: true });
      return { parentBudgetExceeded: true };
    }

    return null;
  }

  onInputAmount(event: Event, controlName: 'budgetCap' | 'initialSpent'): void {
    handleCurrencyInput(event, controlName, this.form, this.decimalPipe)
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.errorMessage.set(null);
    const formValue = this.form.getRawValue();

    if (this.isEditMode() && this.data?.event) {
      this.isSubmitting.set(true);
      const updatePayload: UpdateEventPayload = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        type: formValue.type,
        projectId: formValue.projectId || undefined,
        facultyId: formValue.facultyId,
        budgetCap: Number(formValue.budgetCap),
        initialSpent: Number(formValue.initialSpent || 0),
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString(),
        expectedUpdatedAt: this.data.event.updatedAt,
      };

      this.eventApiService.updateEvent(this.data.event.id, updatePayload).subscribe({
        next: (updatedEvent) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(updatedEvent);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to update event.');
        },
      });
      return;
    }

    const isJoinCodeEnabled = Boolean(formValue.generateJoinCode);
    const payload: CreateEventPayload = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      type: formValue.type,
      projectId: formValue.projectId || undefined,
      facultyId: formValue.facultyId,
      budgetCap: Number(formValue.budgetCap),
      initialSpent: Number(formValue.initialSpent || 0),
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      joinCodeConfig: isJoinCodeEnabled
        ? {
          maxUses: formValue.maxUses ? Number(formValue.maxUses) : null,
          expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : null,
        }
        : null,
    };

    const warningMessage = this.getConfirmationWarning(payload.type);

    if (warningMessage) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: this.translocoService.translate('event.createDialog.warnings.dialogTitle'),
          message: warningMessage,
          confirmText: this.translocoService.translate('event.createDialog.actions.proceed'),
          cancelText: this.translocoService.translate('event.createDialog.actions.review'),
          confirmColor: 'primary',
          icon: 'help_outline',
        } as ConfirmDialogData,
      });

      confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this.executeCreateEvent(payload);
        }
      });
      return;
    }

    this.executeCreateEvent(payload);
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
        title: this.translocoService.translate('event.createDialog.discardModal.title'),
        message: this.translocoService.translate('event.createDialog.discardModal.message'),
        confirmText: this.translocoService.translate('event.createDialog.discardModal.confirm'),
        cancelText: this.translocoService.translate('event.createDialog.discardModal.cancel'),
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

  private getConfirmationWarning(type: EventFundingType): string | null {
    const role = this.authStore.user()?.role;
    if (!role) return null;

    const translationKey = this.WARNING_RULES[role]?.[type];
    return translationKey ? this.translocoService.translate(translationKey, {}, 'event') : null;
  }

  private executeCreateEvent(payload: CreateEventPayload): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.eventApiService.createEvent(payload).subscribe({
      next: (createdEvent) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(createdEvent);
      }
    });
  }
}