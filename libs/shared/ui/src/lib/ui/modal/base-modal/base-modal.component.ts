import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmDialogData } from '@school-expense-ecosystem/shared/types';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface BaseModalData {
  title: string;
  message?: string;
  placeholder?: string;
}

@Component({
  selector: 'lib-base-modal',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatError, FormsModule],
  templateUrl: './base-modal.component.html',
  styleUrl: './base-modal.component.scss',
})
export class BaseModalComponent {
  readonly dialogRef = inject(MatDialogRef<BaseModalComponent>);
  readonly data = inject<BaseModalData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);

  readonly reasonText = signal<string>('');

  onSave() {
    const finalizedReason = this.reasonText().trim();
    if (finalizedReason) {
      // Cleanly pass the text payload back to the invoking component boundary
      this.dialogRef.close(finalizedReason);
    }
  }

  onCancel() {
    if (this.reasonText().trim()) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '380px',
        disableClose: true,
        data: {
          title: 'Discard Changes',
          message: 'You have unsaved changes in the reason field. Are you sure you want to discard them?',
          confirmText: 'Discard',
          cancelText: 'Keep Editing',
          confirmColor: 'warn'
        } as ConfirmDialogData
      });

      confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this.dialogRef.close(null);
        }
      });
      return;
    }

    // Safe to close smoothly if the input field remains pristine
    this.dialogRef.close(null);
  }
}
