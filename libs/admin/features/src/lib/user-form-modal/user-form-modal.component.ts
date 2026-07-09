import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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
import { FormErrorSignalPipe, LoadingDirective } from '@school-expense-ecosystem/shared/ui';
import { email, form, FormField, required, submit, disabled, validate } from '@angular/forms/signals';
import { trackLoading } from '@school-expense-ecosystem/shared/utils';

@Component({
  selector: 'lib-user-form-modal',
  standalone: true,
  imports: [
    MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatSnackBarModule, MatIconModule, TranslocoModule,
    FormErrorSignalPipe, FormField, LoadingDirective
  ],
  templateUrl: './user-form-modal.component.html',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'admin' }
  ],
})
export class UserFormModalComponent implements OnInit {
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
  readonly isLoading = signal<boolean>(false);

  protected readonly authMethodDisplay = signal<string>('Google OAuth');
  protected readonly filteredUserTypeOptions = signal<UserType[]>([]);

  protected readonly currentAdminId = computed(() => this.authStore.user()?.uid ?? '');
  protected readonly isAdmin = computed(() => this.authStore.user()?.role === Role.LEVEL_0_ADMIN);

  protected readonly roleOptions = [Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER];
  protected readonly userTypeOptions = [UserType.STAFF, UserType.TEACHER, UserType.STUDENT];
  protected readonly facultyOptions = [FacultyId.FIT, FacultyId.FBE, FacultyId.FLL];
  protected readonly statusOptions = [UserStatus.ACTIVE, UserStatus.PENDING, UserStatus.ONBOARDING];

  protected readonly canEditProfile = computed(() =>
    this.isDetailMode() &&
    !this.isSelf() &&
    !this.isOnboarding() &&
    this.isAdmin() &&
    !this.targetIsAdmin()
  );

  private readonly selectedRole = computed(() => this.userModel().role);
  private readonly selectedUserType = computed(() => this.userModel().userType);

  protected readonly userModel = signal({
    email: '',
    role: '' as Role,
    userType: '' as UserType,
    fullName: '',
    dateOfBirth: '' as string,
    userCode: '',
    facultyId: null as FacultyId | null,
    password: '',
    confirmPassword: '',
    status: UserStatus.ACTIVE
  });

  protected readonly userForm = form(this.userModel, (s) => {
    required(s.email);
    email(s.email);
    required(s.role);
    required(s.fullName);
    required(s.dateOfBirth);
    required(s.userCode);

    /**
     * 🌟 REFACTOR: Reactive conditional validation rules driven by validate() hooks 
     * to prevent one-time static initialization execution bugs.
     */
    validate(s.password, ({ value }) => {
      if (this.selectedRole() === Role.LEVEL_0_ADMIN && !this.isEditMode() && !value()) {
        return { kind: 'required' };
      }
      return undefined;
    });

    validate(s.confirmPassword, ({ value }) => {
      if (this.selectedRole() === Role.LEVEL_0_ADMIN && !this.isEditMode()) {
        if (!value()) return { kind: 'required' };
        if (value() !== this.userModel().password) return { kind: 'passwordMismatch' };
      }
      return undefined;
    });

    validate(s.userType, ({ value }) => {
      const role = this.selectedRole();
      if ((role === Role.LEVEL_2_DEAN || role === Role.LEVEL_3_USER) && !value()) {
        return { kind: 'required' };
      }
      return undefined;
    });

    validate(s.facultyId, ({ value }) => {
      const role = this.selectedRole();
      const type = this.selectedUserType();

      if (role === Role.LEVEL_2_DEAN && !value()) {
        return { kind: 'required' };
      }
      if (role === Role.LEVEL_3_USER && [UserType.STUDENT, UserType.TEACHER].includes(type) && !value()) {
        return { kind: 'required' };
      }
      return undefined;
    });

    disabled(s.email, { when: () => this.isDetailMode() || this.isEditMode() });
    disabled(s.userCode, { when: () => this.isDetailMode() || this.isEditMode() });
    disabled(s.role, { when: () => this.isDetailMode() });

    disabled(s.userType, {
      when: () =>
        this.isDetailMode() ||
        this.selectedRole() === Role.LEVEL_0_ADMIN ||
        this.selectedRole() === Role.LEVEL_1_FINANCE
    });

    disabled(s.facultyId, {
      when: () => {
        if (this.isDetailMode()) return true;
        const role = this.selectedRole();
        if (role === Role.LEVEL_0_ADMIN || role === Role.LEVEL_1_FINANCE) return true;
        if (role === Role.LEVEL_3_USER) {
          return ![UserType.STUDENT, UserType.TEACHER].includes(this.selectedUserType());
        }
        return false;
      }
    });

    disabled(s.password, {
      when: () =>
        this.isDetailMode() ||
        this.isEditMode() ||
        this.selectedRole() !== Role.LEVEL_0_ADMIN
    });

    disabled(s.confirmPassword, {
      when: () =>
        this.isDetailMode() ||
        this.isEditMode() ||
        this.selectedRole() !== Role.LEVEL_0_ADMIN
    });

    disabled(s.dateOfBirth, {
      when: () => this.isDetailMode()
    })

    disabled(s.fullName, {
      when: () => this.isDetailMode()
    })

    disabled(s.status, { when: () => this.isDetailMode() || this.isEditMode() });

  });

  constructor() {
    /**
     * 🌟 REFACTOR: Reactive context manager handling structural form side-effects cleanly
     * without maintaining tedious manual RxJS valueChanges streams subscription trackers.
     */
    effect(() => {
      const role = this.selectedRole();

      if (role === Role.LEVEL_0_ADMIN || role === Role.LEVEL_1_FINANCE) {
        this.userModel.update(m => ({ ...m, userType: UserType.STAFF, facultyId: null }));
      } else if (role === Role.LEVEL_2_DEAN) {
        this.filteredUserTypeOptions.set(this.userTypeOptions.filter(type => type !== UserType.STUDENT));
      } else if (role === Role.LEVEL_3_USER) {
        this.filteredUserTypeOptions.set(this.userTypeOptions);
      }
    });

    effect(() => {
      const role = this.selectedRole();
      const isLocalAdminProv = role === Role.LEVEL_0_ADMIN && !this.isEditMode();
      this.authMethodDisplay.set(isLocalAdminProv ? 'system' : 'google');
    });

    effect(() => {
      const selectedType = this.selectedUserType();
      const role = this.selectedRole();

      if (role === Role.LEVEL_3_USER) {
        const isAcademic = [UserType.STUDENT, UserType.TEACHER].includes(selectedType);
        if (!isAcademic) {
          this.userModel.update(m => ({ ...m, facultyId: null }));
        }
      }
    });
  }

  ngOnInit(): void {
    this.mapIncomingDialogAction();
    // 🌟 REFACTOR: Stripped out old imperative form structure builders and control registers
    if (this.isEditMode() || this.isDetailMode()) {
      this.hydrateFormTree();
    }
  }

  private hydrateFormTree(): void {
    const user = this.dialogData.user as UserBase;

    /**
     * 🌟 REFACTOR: Inject data into the reactive model directly instead of calling patchValue()
     */
    this.userModel.set({
      email: user.email ?? '',
      role: user.role,
      userType: user.userType ?? '' as UserType,
      fullName: user.fullName ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      userCode: (user as any).userCode ?? '',
      facultyId: user.facultyId ?? null,
      password: '',
      confirmPassword: '',
      status: user.status ?? UserStatus.ACTIVE
    });

    this.isOnboarding.set(user.status === UserStatus.ONBOARDING);
    this.isSelf.set(user.uid === this.currentAdminId());
    this.targetIsAdmin.set(user.role === Role.LEVEL_0_ADMIN);
  }

  private mapIncomingDialogAction(): void {
    const actionMap: Partial<Record<DialogActionEnum, 'create' | 'edit' | 'detail'>> = {
      [DialogActionEnum.Create]: 'create',
      [DialogActionEnum.Edit]: 'edit',
      [DialogActionEnum.Detail]: 'detail',
    };
    this.mode.set(actionMap[this.dialogData?.action as DialogActionEnum] ?? 'create');
  }

  protected onSubmit(): void {
    if (this.userForm().invalid()) return;

    /**
     * 🌟 REFACTOR: Execute stream mutations safely mapped into Signal Form submit triggers
     */
    submit(this.userForm, async () => {
      const rawForm = this.userModel();
      const targetUid = this.dialogData?.user?.uid;
      const isScopedRole = [Role.LEVEL_2_DEAN, Role.LEVEL_3_USER].includes(rawForm.role);

      const basePayload = {
        fullName: rawForm.fullName,
        role: rawForm.role,
        userType: rawForm.userType as UserType,
        dateOfBirth: rawForm.dateOfBirth,
        facultyId: isScopedRole ? (rawForm.facultyId ?? undefined) : undefined
      };

      const mutation$ = this.isEditMode()
        ? this.userListService.updateUser(targetUid, basePayload)
        : this.userListService.provisionUser({
          ...basePayload,
          email: rawForm.email,
          userCode: rawForm.userCode,
          ...(rawForm.role === Role.LEVEL_0_ADMIN ? { password: rawForm.password } : {})
        } as CreateUserInput);

      mutation$.pipe(trackLoading(this.isLoading)).subscribe({
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
    })
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
    /**
     * 🌟 REFACTOR: Toggling the view mode signal automatically propagates interactive 
     * property changes down to template inputs via native declarative bindings.
     */
    this.mode.set('edit');
  }
}