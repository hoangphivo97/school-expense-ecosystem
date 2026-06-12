import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { LoginResponse, UserStatus } from '@school-expense-ecosystem/auth/types';
import { catchError, tap, throwError } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { FirebaseError } from 'firebase/app';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { RegisterModalComponent } from './register-modal/register-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCheckboxModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {

  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly router = inject(Router);
  public readonly authService = inject(AuthService)
  private readonly authStore = inject(AuthSignalStore)
  private readonly errorModalService = inject(ErrorModalService);

  loading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    passWord: ['', Validators.required],
  });

  ngOnInit(): void {
  }

  loginAction() {
    if (this.loginForm.invalid) return;

    const { email, passWord } = this.loginForm.getRawValue();

    this.authService
      .signInWithUserAccount(email, passWord)
      .pipe(
        tap((res: LoginResponse) => {
          this.updateTokenAndReRoute(res.token, res.user);
        }),
        catchError((err: FirebaseError) => {
          this.errorModalService.openErrorModal(err);
          return throwError(() => err);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loginWithGoogle() {
    if (this.loading) return;
    this.loading = true;

    this.authService
      .signInWithGoogleAccount()
      .pipe(
        tap((res: any) => {
          this.updateTokenAndReRoute(res.token, res.user);
          this.loading = false;
        }),
        catchError((err: FirebaseError) => {
          this.errorModalService.openErrorModal(err);
          this.loading = false;
          return throwError(() => err);
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  updateTokenAndReRoute(token: string, user: any) {
    this.authStore.updateAuthState(token, user);

    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    if (user.status === UserStatus.ONBOARDING) {
      this.router.navigate(['/auth/onboarding']);
    } else if (user.status === UserStatus.PENDING) {
      this.router.navigate(['/auth/waiting-approval']);
    } else if (user.status === UserStatus.ACTIVE) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth']);
    }
  }

  openRegisterModal() {
    this.dialog.open(RegisterModalComponent, {
      width: '450px',
      disableClose: false,
    });
  }

}
