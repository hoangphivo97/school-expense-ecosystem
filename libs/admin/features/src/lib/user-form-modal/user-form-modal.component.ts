import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FacultyId, Role, UserStatus, UserType } from '@school-expense-ecosystem/auth/types';
import { DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';

@Component({
  selector: 'lib-user-form-modal',
  imports: [],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss',
})
export class UserFormModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserFormModalComponent>);
  readonly configData = inject<DialogData>(MAT_DIALOG_DATA);
  readonly DialogActionEnum = DialogActionEnum

  readonly userForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    userCode: new FormControl('', [Validators.required]),
    role: new FormControl(Role, [Validators.required]),
    userType: new FormControl(UserType, [Validators.required]),
    facultyId: new FormControl(FacultyId),
    status: new FormControl(UserStatus.ACTIVE)
  });

  ngOnInit(): void {
    if (this.configData.action === DialogActionEnum.Edit && this.configData.data) {
      this.userForm.patchValue(this.configData.data);
      
      this.userForm.get('email')?.disable();
      this.userForm.get('userCode')?.disable();
    } else {
      this.userForm.get('status')?.disable();
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    
    this.dialogRef.close({
      mode: this.configData.action,
      payload: this.userForm.getRawValue()
    });
  }
}
