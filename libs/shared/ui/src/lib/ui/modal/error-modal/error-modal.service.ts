import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { ErrorModalComponent } from '../../modal/error-modal/error-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { getFriendlyFirebaseError } from '@school-expense-ecosystem/shared/utils';

@Injectable({
  providedIn: 'root',
})
export class ErrorModalService {
  private dialog = inject(MatDialog);
  
  openErrorModal(error: FirebaseError) {
    this.dialog.open(ErrorModalComponent, {
      width: '400px',
      data: getFriendlyFirebaseError(error),
      disableClose: true,
    });
  }

  closeAllModals() {
    this.dialog.closeAll();
  }
}
