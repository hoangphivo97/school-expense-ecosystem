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

@Component({
  selector: 'lib-user-delete-modal',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatIconModule, FormField],
  templateUrl: './user-delete-modal.html',
  styleUrl: './user-delete-modal.scss',
})
export class UserDeleteModalComponent {
  private readonly userListService = inject(UserListService);
  private readonly dialogRef = inject(MatDialogRef<UserDeleteModalComponent>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogData = inject(MAT_DIALOG_DATA);
  protected readonly targetUser = this.dialogData.user as UserBase;
  protected readonly DeleteReasonType = DeleteReasonType;

  protected readonly deleteModel = signal<DeleteUserPayload>({
    reasonType: DeleteReasonType.INPUT_ERROR,
    confirmationText: ''
  });

  protected readonly deleteForm = form(this.deleteModel, (fields) => {
    required(fields.reasonType);

    validate(fields.confirmationText, ({value}) => {
      const currentReason = this.deleteModel().reasonType;
      const text = value();

      if (currentReason === DeleteReasonType.INPUT_ERROR) {
        if (!text) {
          return { kind: 'required', message: "This field is required" };
        }
        if (text !== 'DELETE') {
          return { kind: 'pattern' , message: "Verification match string failure (Must be exactly 'DELETE')" };
        }
      }
      return undefined;
    });
  });

  protected readonly isSubmitDisabled = computed(() => this.deleteForm().invalid());

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

    this.userListService.deleteUser(this.targetUser.uid, payload).subscribe({
      next: () => {
        this.snackBar.open('Account purged successfully.', 'Close', { duration: 4000 });
        this.dialogRef.close({ isDeleted: true, targetUid: this.targetUser.uid });
      }
    });
  }
}
