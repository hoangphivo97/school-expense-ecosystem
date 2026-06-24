import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { ErrorModalComponent } from '../../modal/error-modal/error-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { getFriendlyErrorMessage } from '@school-expense-ecosystem/shared/utils';
import { DialogError } from '@school-expense-ecosystem/shared/types';

@Injectable({
  providedIn: 'root',
})
export class ErrorModalService {
  private dialog = inject(MatDialog);

  openErrorModal(error: FirebaseError) {
    this.dialog.open(ErrorModalComponent, {
      width: '400px',
      data: getFriendlyErrorMessage(error),
      disableClose: true,
    });
  }

  openCustomErrorModal(dialogData: DialogError) {
    this.dialog.open(ErrorModalComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true,
    });
  }

  closeAllModals() {
    this.dialog.closeAll();
  }
}
