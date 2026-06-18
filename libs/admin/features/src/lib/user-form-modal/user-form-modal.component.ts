import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Role, UserType, UserStatus, FacultyId } from '@school-expense-ecosystem/auth/types';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'admin-user-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormField, MatLabel, MatOption, MatError, MatSelect, MatFormFieldModule, MatInputModule, MatButton, MatSnackBarModule],
  templateUrl: './user-form-modal.component.html'
})
export class UserFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userListService = inject(UserListService);
  private readonly dialogRef = inject(MatDialogRef<UserFormModalComponent>);
  protected readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly snackBar = inject(MatSnackBar);

  // Expose Enums directly to the HTML template for structural directive evaluations
  protected readonly Role = Role;
  protected readonly UserType = UserType;
  protected readonly UserStatus = UserStatus;

  protected filteredUserTypeOptions = signal<any[]>([]);

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
    // { value: UserStatus.SUSPENDED, label: 'Suspended' }
  ];

  // Component state management
  protected isEditMode = false;
  protected authMethodDisplay = signal<string>('Google OAuth');
  protected userForm!: FormGroup;

  ngOnInit(): void {
    this.isEditMode = !!this.dialogData?.user;
    this.initFormStructure();
    this.registerReactiveEngines();

    if (this.isEditMode) {
      this.patchExistingData();
    }
  }

  /**
   * Initializes the Reactive Form structural invariants and standard validators.
   */
  private initFormStructure(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      userCode: ['', [Validators.required]],
      facultyId: [{ value: null, disabled: true }], // Locked by default, dynamically enabled via role
      password: [{ value: '', disabled: true }],
      confirmPassword: [{ value: '', disabled: true }],    // Enforced only for local Admin provisioning
      status: [{ value: UserStatus.ACTIVE, disabled: true }]                   // Utilized exclusively within update streams
    }, {
      validators: [this.passwordMatchValidator]
    });

    // Immutable fields isolation during data modification mutations
    if (this.isEditMode) {
      this.userForm.get('email')?.disable();
      this.userForm.get('userCode')?.disable();
    }
  }

  private registerReactiveEngines(): void {
    // Stream 1: Monitor Role mutations to toggle secondary branches
    this.userForm.get('role')?.valueChanges.subscribe((selectedRole: Role) => {
      this.evaluateRoleConditionalState(selectedRole);
    });

    // Stream 2: Monitor UserType mutations specifically for Level 3 sub-branch visibility
    this.userForm.get('userType')?.valueChanges.subscribe((selectedType: UserType) => {
      this.evaluateUserTypeConditionalState(selectedType);
    });
  }

  /**
   * Dynamic UI Logic Engine.
   * Monitors operational role mutations to dynamically handle field visibility,
   * authentication mechanics, and data isolation boundaries.
   */
  private evaluateRoleConditionalState(selectedRole: Role): void {
    const facultyCtrl = this.userForm.get('facultyId');
    const passwordCtrl = this.userForm.get('password');
    const confirmPasswordCtrl = this.userForm.get('confirmPassword');
    const userTypeCtrl = this.userForm.get('userType');

    // Branch 1 & 2: Institutional Back-office Management (Admin / Finance)
    if (selectedRole === Role.LEVEL_0_ADMIN || selectedRole === Role.LEVEL_1_FINANCE) {
      userTypeCtrl?.setValue(UserType.STAFF);
      userTypeCtrl?.disable();
      facultyCtrl?.disable();
      facultyCtrl?.setValue(null);

      if (selectedRole === Role.LEVEL_0_ADMIN && !this.isEditMode) {
        this.authMethodDisplay.set('System Email/Password');
        this.toggleControlState(passwordCtrl, true, [Validators.required, Validators.minLength(6)]);
        this.toggleControlState(confirmPasswordCtrl, true, [Validators.required]);
      } else {
        this.authMethodDisplay.set('Google OAuth');
        this.toggleControlState(passwordCtrl, false);
        this.toggleControlState(confirmPasswordCtrl, false);
      }
    }
    // Branch 3: Faculty Dean Domain Scope
    else if (selectedRole === Role.LEVEL_2_DEAN) {
      this.authMethodDisplay.set('Google OAuth');
      this.toggleControlState(passwordCtrl, false);
      this.toggleControlState(confirmPasswordCtrl, false);

      // Filter out STUDENT classification for Deans
      this.filteredUserTypeOptions.set(this.userTypeOptions.filter(o => o.value !== UserType.STUDENT));
      userTypeCtrl?.enable();

      this.toggleControlState(facultyCtrl, true, [Validators.required]);
    }
    // Branch 4: Standard End Users
    else if (selectedRole === Role.LEVEL_3_USER) {
      this.authMethodDisplay.set('Google OAuth');
      this.toggleControlState(passwordCtrl, false);
      this.toggleControlState(confirmPasswordCtrl, false);

      // Expose complete user classification choices
      this.filteredUserTypeOptions.set(this.userTypeOptions);
      userTypeCtrl?.enable();

      // Initial reset, sub-state will be calculated by the UserType subscriber stream
      facultyCtrl?.setValue(null);
      facultyCtrl?.disable();
    }

    this.refreshFormTreeValidity();
  }

  private evaluateUserTypeConditionalState(selectedType: UserType): void {
    const role = this.userForm.get('role')?.value;
    const facultyCtrl = this.userForm.get('facultyId');

    // Only apply sub-logic constraints to standard Level 3 End Users
    if (role === Role.LEVEL_3_USER) {
      if (selectedType === UserType.STUDENT || selectedType === UserType.TEACHER) {
        this.toggleControlState(facultyCtrl, true, [Validators.required]);
      } else if (selectedType === UserType.STAFF) {
        this.toggleControlState(facultyCtrl, false);
      }
      facultyCtrl?.updateValueAndValidity();
    }
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const role = control.get('role')?.value;

    if (role === Role.LEVEL_0_ADMIN && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  private toggleControlState(ctrl: AbstractControl | null, enable: boolean, validators: any[] = []): void {
    if (!ctrl) return;
    if (enable) {
      ctrl.enable();
      if (validators.length > 0) ctrl.setValidators(validators);
    } else {
      ctrl.disable();
      ctrl.setValue('');
      ctrl.clearValidators();
    }
  }

  private refreshFormTreeValidity(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Hydrates the form state with pre-existing persistence layers during edit operations.
   */
  private patchExistingData(): void {
    const user = this.dialogData.user;
    this.userForm.patchValue({
      email: user.email,
      role: user.role,
      userType: user.userType,
      fullName: user.fullName,
      userCode: user.userCode,
      facultyId: user.facultyId,
      status: user.status
    });
  }

  /**
   * Dispatches the validated data payload to the infrastructure API layer.
   */
  protected onSubmit(): void {
    if (this.userForm.invalid) return;

    const rawForm = this.userForm.getRawValue();
    const selectedRole = rawForm.role;

    if (this.isEditMode) {

      const updatePayload = {
        fullName: rawForm.fullName,
        role: rawForm.role,
        userType: rawForm.userType,
        status: rawForm.status,
        facultyId: (selectedRole === Role.LEVEL_2_DEAN || selectedRole === Role.LEVEL_3_USER) ? rawForm.facultyId : null
      };

      this.userListService.updateUser(this.dialogData.user.uid, updatePayload).subscribe({
        next: () => {
          this.showNotification('User profile updated successfully!', 'success');
          this.dialogRef.close({ isSuccess: true, payload: updatePayload });
        },
        error: (err) => this.handleLocalApiError(err)
      });

    } else {

      const provisionPayload: any = {
        email: rawForm.email,
        role: rawForm.role,
        userType: rawForm.userType,
        userCode: rawForm.userCode,
        fullName: rawForm.fullName,
        facultyId: (selectedRole === Role.LEVEL_2_DEAN || selectedRole === Role.LEVEL_3_USER) ? rawForm.facultyId : null
      };

      if (selectedRole === Role.LEVEL_0_ADMIN) {
        provisionPayload.password = rawForm.password;
      }

      this.userListService.provisionUser(provisionPayload).subscribe({
        next: () => {
          this.showNotification('Account provisioned successfully!', 'success');
          this.dialogRef.close({ isSuccess: true, payload: provisionPayload });
        },
        error: (err) => this.handleLocalApiError(err)
      });
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000, // Visible for 5 seconds to let the admin read the full error
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
    });
  }

  private handleLocalApiError(err: any): void {
    console.error('Infrastructure API mutation failure:', err);
    const apiMessage = Array.isArray(err.error?.message)
      ? err.error.message[0]
      : (err.error?.message || 'Operational failure inside system directory.');
    this.showNotification(`Error: ${apiMessage}`, 'error');
  }
}