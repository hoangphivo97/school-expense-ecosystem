import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';
import { MatButton } from '@angular/material/button';
import { ErrorModalService } from '../error-modal/error-modal.service';

@Component({
  selector: 'lib-base-modal',
  standalone: true,
  imports: [MatDialogActions, MatDialogContent, MatDialogTitle, MatButton],
  templateUrl: './base-modal.component.html',
  styleUrl: './base-modal.component.scss',
})
export class BaseModalComponent {
  readonly dialogRef = inject(MatDialogRef<BaseModalComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly errorModalService = inject(ErrorModalService);

  dialogActionEnum = DialogActionEnum;

  onSave() {
    const isCancel: boolean = this.data.action === DialogActionEnum.Cancel
    const isSuccess: boolean = this.data.isSuccess === true
    if (isCancel && isSuccess) {
      this.errorModalService.closeAllModals();
    } else {
      this.dialogRef.close({ 
        title: "Delete", 
        action: this.dialogActionEnum.Delete, 
        isSuccess: true,
        data: this.data.data 
      } as DialogData);
    }
  }

  onCancel() {
    this.dialogRef.close({
      title: 'Delete',
      action: this.dialogActionEnum.Delete,
      isSuccess: false,
    } as DialogData);
  }
}
