import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Role, UserType, UserStatus, FacultyId, UserBase } from '@school-expense-ecosystem/shared/types';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DialogActionEnum } from '@school-expense-ecosystem/shared/types';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CreateUserInput } from '@school-expense-ecosystem/admin/types';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FormErrorPipe } from '@school-expense-ecosystem/shared/ui';

@Component({
  selector: 'lib-user-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatSnackBarModule, MatIconModule, TranslocoModule,
    FormErrorPipe
  ],
  templateUrl: './user-form-modal.component.html',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'admin' }
  ],
})
export class UserFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userListService = inject(UserListService);
  private readonly dialogRef = inject(MatDialogRef<UserFormModalComponent>);
  protected readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthSignalStore);
  private readonly translocoService = inject(TranslocoService);

  // Unify Component State into Modern Angular Signals
  protected readonly mode = signal<'create' | 'edit' | 'detail'>('create');
  protected readonly isEditMode = computed(() => this.mode() === 'edit');
  protected readonly isDetailMode = computed(() => this.mode() === 'detail');
  protected readonly isSelf = signal(false);
  protected readonly isOnboarding = signal(false);
  protected readonly targetIsAdmin = signal(false);

  protected readonly authMethodDisplay = signal<string>('Google OAuth');
  protected readonly filteredUserTypeOptions = signal<any[]>([]);
  protected userForm!: FormGroup;

  protected readonly currentAdminId = computed(() => this.authStore.user()?.uid ?? '');
  protected readonly isAdmin = computed(() => this.authStore.user()?.role === Role.LEVEL_0_ADMIN);

  protected readonly canEditProfile = computed(() =>
    this.isDetailMode() &&
    !this.isSelf() &&
    !this.isOnboarding() &&
    this.isAdmin() &&
    !this.targetIsAdmin()
  );

  // Static Metadata Dropdowns
  protected readonly roleOptions = [
    { value: Role.LEVEL_0_ADMIN, label: 'System Admin (Backdoor)' },
    { value: Role.LEVEL_1_FINANCE, label: 'Finance Officer (Institutional)' },
    { value: Role.LEVEL_2_DEAN, label: 'Faculty Dean (Isolated Scope)' },
    { value: Role.LEVEL_3_USER, label: 'Teacher / Student' }
  ];

  protected readonly userTypeOptions = [
    { value: UserType.STAFF, label: 'Staff Member' },
    { value: UserType.TEACHER, label: 'Teacher' },
    { value: UserType.STUDENT, label: 'Student' }
  ];

  protected readonly facultyOptions = [
    { value: FacultyId.FIT, label: 'Faculty of Information Technology (FIT)' },
    { value: FacultyId.FBE, label: 'Faculty of Business and Economics (FBE)' },
    { value: FacultyId.FLL, label: 'Faculty of Foreign Languages (FLL)' }
  ];

  protected readonly statusOptions = [
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.PENDING, label: 'Pending' },
    { value: UserStatus.ONBOARDING, label: 'Onboarding' }
  ];

  ngOnInit(): void {
    this.mapIncomingDialogAction();
    this.initFormStructure();
    this.registerReactiveEngines();

    if (this.isEditMode() || this.isDetailMode()) {
      this.hydrateFormTree();
    }
  }

  private mapIncomingDialogAction(): void {
    const actionMap: Partial<Record<DialogActionEnum, 'create' | 'edit' | 'detail'>> = {
      [DialogActionEnum.Create]: 'create',
      [DialogActionEnum.Edit]: 'edit',
      [DialogActionEnum.Detail]: 'detail',
    };
    this.mode.set(actionMap[this.dialogData?.action as DialogActionEnum] ?? 'create');
  }

  private initFormStructure(): void {
    this.userForm = this.fb.group({
      email: [{ value: '', disabled: this.isEditMode() }, [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required]],
      userCode: [{ value: '', disabled: this.isEditMode() }, [Validators.required]],
      facultyId: [{ value: null, disabled: true }],
      password: [{ value: '', disabled: true }],
      confirmPassword: [{ value: '', disabled: true }],
      status: [{ value: UserStatus.ACTIVE, disabled: true }]
    }, { validators: [this.passwordMatchValidator] });
  }

  private registerReactiveEngines(): void {
    this.userForm.get('role')?.valueChanges.subscribe(role => this.evaluateRoleConditionalState(role));
    this.userForm.get('userType')?.valueChanges.subscribe(type => this.evaluateUserTypeConditionalState(type));
  }

  private evaluateRoleConditionalState(selectedRole: Role): void {
    const { facultyId, password, confirmPassword, userType } = this.userForm.controls;
    const isLocalAdminProv = selectedRole === Role.LEVEL_0_ADMIN && !this.isEditMode();

    // Reset default behaviors
    this.authMethodDisplay.set(isLocalAdminProv ? 'system' : 'google');
    this.toggleControlState(password, isLocalAdminProv, [Validators.required, Validators.minLength(6)]);
    this.toggleControlState(confirmPassword, isLocalAdminProv, [Validators.required]);

    switch (selectedRole) {
      case Role.LEVEL_0_ADMIN:
      case Role.LEVEL_1_FINANCE:
        userType.setValue(UserType.STAFF);
        userType.disable();
        this.toggleControlState(facultyId, false);
        break;

      case Role.LEVEL_2_DEAN:
        this.filteredUserTypeOptions.set(this.userTypeOptions.filter(o => o.value !== UserType.STUDENT));
        userType.enable();
        this.toggleControlState(facultyId, true, [Validators.required]);
        break;

      case Role.LEVEL_3_USER:
        this.filteredUserTypeOptions.set(this.userTypeOptions);
        userType.enable();
        this.toggleControlState(facultyId, false);
        break;
    }
    this.refreshFormTreeValidity();
  }

  private evaluateUserTypeConditionalState(selectedType: UserType): void {
    if (this.userForm.get('role')?.value === Role.LEVEL_3_USER) {
      const isAcademic = [UserType.STUDENT, UserType.TEACHER].includes(selectedType);
      this.toggleControlState(this.userForm.get('facultyId')!, isAcademic, [Validators.required]);
    }
  }

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const isSystemAdmin = control.get('role')?.value === Role.LEVEL_0_ADMIN;

    if (isSystemAdmin && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  };

  private toggleControlState(ctrl: AbstractControl, enable: boolean, validators: ValidatorFn[] = []): void {
    if (enable) {
      ctrl.enable();
    } else {
      ctrl.disable();
    }
    ctrl.setValidators(enable ? validators : []);
    if (!enable) ctrl.setValue(ctrl === this.userForm.get('facultyId') ? null : '');
  }

  private refreshFormTreeValidity(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private hydrateFormTree(): void {
    const user = this.dialogData.user as UserBase;
    this.userForm.patchValue({ ...user, dateOfBirth: user.dateOfBirth ?? '' });

    this.isOnboarding.set(user.status === UserStatus.ONBOARDING);
    this.isSelf.set(user.uid === this.currentAdminId());
    this.targetIsAdmin.set(user.role === Role.LEVEL_0_ADMIN);

    if (this.isDetailMode()) this.userForm.disable();
  }

  protected onSubmit(): void {
    if (this.userForm.invalid) return;

    const rawForm = this.userForm.getRawValue();
    const targetUid = this.dialogData?.user?.uid;
    const isScopedRole = [Role.LEVEL_2_DEAN, Role.LEVEL_3_USER].includes(rawForm.role);

    // Streamlined Base Payload Construction
    const basePayload = {
      fullName: rawForm.fullName,
      role: rawForm.role,
      userType: rawForm.userType,
      dateOfBirth: rawForm.dateOfBirth,
      facultyId: isScopedRole ? rawForm.facultyId : null
    };

    const mutation$ = this.isEditMode()
      ? this.userListService.updateUser(targetUid, basePayload)
      : this.userListService.provisionUser({
        ...basePayload,
        email: rawForm.email,
        userCode: rawForm.userCode,
        ...(rawForm.role === Role.LEVEL_0_ADMIN ? { password: rawForm.password } : {})
      } as CreateUserInput);

    mutation$.subscribe({
      next: () => {
        const successKey = this.isEditMode() ? 'admin.userForm.notifications.updateSuccess' : 'admin.userForm.notifications.provisionSuccess';
        const msg = this.translocoService.translate(successKey);
        this.showNotification(msg, 'success');
        this.dialogRef.close({ isSuccess: true, payload: basePayload });
      },
      error: (err) => {
        if (err.status === 403 && err.error?.errorCode === 'AUTH_DEMO_READ_ONLY') {
          return;
        }
        console.error('User mutation pipeline failed:', err);

        const fallbackKey = this.isEditMode() ? 'admin.userForm.notifications.updateError' : 'admin.userForm.notifications.provisionError';
        const fallbackMsg = this.translocoService.translate(fallbackKey);

        const apiErrorMsg = err.error?.errorMsg || fallbackMsg;

        this.showNotification(apiErrorMsg, 'error');
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
    });
  }

  protected switchToEditMode(): void {
    this.mode.set('edit');
    this.userForm.enable();

    // Maintain immutable field constraints
    ['email', 'userCode', 'status'].forEach(k => this.userForm.get(k)?.disable());
    this.evaluateRoleConditionalState(this.userForm.get('role')?.value);
  }
}