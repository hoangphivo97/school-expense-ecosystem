import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BaseModalComponent } from '@school-expense-ecosystem/shared/ui';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogActionEnum } from '@school-expense-ecosystem/shared/types';
import { ConfirmExitModal } from '@school-expense-ecosystem/shared/constants';

@Component({
  selector: 'lib-register-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.scss',
})
export class RegisterModalComponent {
  readonly dialogRef = inject(MatDialogRef<RegisterModalComponent>);
  private fb =  inject(FormBuilder);
  private dialog = inject(MatDialog); 

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    passWord: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

  onCancel() {
    const isEmpty: boolean = Object.values(this.registerForm.value).every(
      (value) => !value,
    );

    if (!isEmpty) {
      this.openConfirmModal(
        ConfirmExitModal.TITLE,
        ConfirmExitModal.YOUR_DATA_WILL_LOST,
      );
    } else {
      console.log(this.registerForm.value);
      this.dialogRef.close();
    }
  }

  openConfirmModal(title: string, message: string) {
    this.dialog.open(BaseModalComponent, {
      height: '200px',
      width: '400px',
      data: {
        title: title,
        content: message,
        action: DialogActionEnum.Cancel,
        isSuccess: true,
      },
      disableClose: true,
    });
  }

  getErrorMessage(fieldName: string): string | null {
    const control = this.registerForm.get(fieldName);
    if (control?.touched) {
      if (control.hasError('required')) return 'This field is required';
      if (control.hasError('email')) return 'Invalid Email';
    }

    return null;
  }

  get confirmPasswordField() {
    return this.registerForm.get('confirmPassword');
  }

  get checkPassAndConfPass() {
    return (
      this.registerForm.get('passWord')?.value !==
      this.confirmPasswordField?.value
    );
  }
}
