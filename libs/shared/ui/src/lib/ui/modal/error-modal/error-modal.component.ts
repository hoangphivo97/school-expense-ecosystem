import { Component, inject } from '@angular/core';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { DialogError } from '@school-expense-ecosystem/shared/types';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBug } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lib-error-modal',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatIconModule,
    FontAwesomeModule,
  ],
  templateUrl: './error-modal.component.html',
  styleUrl: './error-modal.component.scss',
})
export class ErrorModalComponent {
  message: string | null = null;
  dialogRef = inject(MatDialogRef<ErrorModalComponent>);
  data = inject<DialogError>(MAT_DIALOG_DATA);
  faBug = faBug;

  onCancel() {
    this.dialogRef.close();
  }
}
