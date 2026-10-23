import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };

  /**
   * Display translated success toast
   */
  success(translationKey: string, params?: Record<string, unknown>, config?: MatSnackBarConfig): void {
    const message = this.transloco.translate(translationKey, params);
    this.snackBar.open(message, undefined, {
      ...this.defaultConfig,
      panelClass: ['toast-success'],
      ...config,
    });
  }

  /**
   * Display translated error toast
   */
  error(translationKey: string, params?: Record<string, unknown>, config?: MatSnackBarConfig): void {
    const message = this.transloco.translate(translationKey, params);
    this.snackBar.open(message, undefined, {
      ...this.defaultConfig,
      panelClass: ['toast-error'],
      ...config,
    });
  }

  warning(translationKeyOrMsg: string, config?: MatSnackBarConfig): void {
    const message = this.transloco.translate(translationKeyOrMsg) || translationKeyOrMsg;
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration: 6000,
      panelClass: ['toast-warning'],
      ...config,
    });
  }
}