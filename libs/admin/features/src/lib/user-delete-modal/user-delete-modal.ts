import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { DeleteReasonType, DeleteUserPayload } from '@school-expense-ecosystem/admin/types';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { form, FormField, required, validate, } from '@angular/forms/signals';
import { FormErrorSignalPipe, LoadingDirective } from '@school-expense-ecosystem/shared/ui';
import { trackLoading } from '@school-expense-ecosystem/shared/utils-frontend';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'lib-user-delete-modal',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatIconModule, FormField, LoadingDirective, TranslocoModule, FormErrorSignalPipe],
  templateUrl: './user-delete-modal.html',
  styleUrl: './user-delete-modal.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'admin' }
  ]
})
export class UserDeleteModalComponent {
  private readonly userListService = inject(UserListService);
  private readonly dialogRef = inject(MatDialogRef<UserDeleteModalComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translocoService = inject(TranslocoService);

  protected readonly dialogData = inject(MAT_DIALOG_DATA);
  protected readonly targetUser = this.dialogData.user as UserBase;
  protected readonly DeleteReasonType = DeleteReasonType;

  readonly isLoading = signal<boolean>(false);
  protected readonly deleteModel = signal<DeleteUserPayload>({
    reasonType: DeleteReasonType.INPUT_ERROR,
    confirmationText: ''
  });

  protected readonly deleteForm = form(this.deleteModel, (fields) => {
    required(fields.reasonType);

    validate(fields.confirmationText, ({ value }) => {
      const currentReason = this.deleteModel().reasonType;
      const text = value();

      if (currentReason === DeleteReasonType.INPUT_ERROR) {
        if (!text) {
          return { kind: 'required' };
        }
        if (text !== 'DELETE') {
          return { kind: 'pattern' };
        }
      }
      return undefined;
    });
  });

  protected readonly isSubmitDisabled = computed(() => this.deleteForm().invalid() || this.isLoading());

  protected readonly reasonOptions = [
    { value: DeleteReasonType.INPUT_ERROR, label: 'Option A: Input Data Error (Removable)' },
    { value: DeleteReasonType.SECURITY_THREAT, label: 'Option B: Security Threat Boundary Violation (Lock Permanently)' }
  ];

  protected onSubmit(): void {
    if (this.isSubmitDisabled()) return;

    const payload = this.deleteModel();

    if (payload.reasonType === DeleteReasonType.SECURITY_THREAT) {
      this.snackBar.open('Security protocol active: User status locked.', 'Close', { duration: 4000 });
      this.dialogRef.close({ isDeleted: false, action: 'SECURITY_LOCKED' });
      return;
    }

    this.userListService.deleteUser(this.targetUser.uid, payload).pipe(trackLoading(this.isLoading)).subscribe({
      next: () => {
        const successMsg = this.translocoService.translate('admin.userList.deleteModal.notifications.purgeSuccess');
        this.snackBar.open(successMsg, 'Close', { duration: 4000 });
        this.dialogRef.close({ isDeleted: true, targetUid: this.targetUser.uid });
      },
      error: (err) => {
        if (err.status === 403 && err.error?.errorCode === 'AUTH_DEMO_READ_ONLY') {
          return;
        }
        console.error('Account purging pipeline failed:', err);

        const fallbackMsg = 'Failed to purge user account due to administrative policy restrictions.';
        const apiErrorMsg = err.error?.errorMsg || fallbackMsg;

        this.snackBar.open(apiErrorMsg, 'Close', {
          duration: 5000,
          panelClass: ['toast-error']
        });
      }
    });
  }
}
