import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { LoginResponse } from '@school-expense-ecosystem/auth/types';
import { DemoAccount, Role, UserBase, UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { ErrorModalService, FormErrorSignalPipe } from '@school-expense-ecosystem/shared/ui';
import { MatCardModule } from '@angular/material/card';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons/faGoogle';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons/faShieldHalved';
import { MatSelectModule } from '@angular/material/select';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { DemoAccountArr } from '@school-expense-ecosystem/shared/constants';
import { MatInputModule } from '@angular/material/input';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { LoginCaseStudyComponent } from '@school-expense-ecosystem/auth/ui';

export interface DemoAccountViewModel extends DemoAccount {
  translationKey: string;
}

@Component({
  selector: 'lib-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    MatError,
    MatProgressSpinner,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
    FormErrorSignalPipe,
    TranslocoModule,
    LoginCaseStudyComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'auth' },
  ],
})
export class LoginComponent {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthSignalStore);
  private readonly errorModalService = inject(ErrorModalService);

  readonly faGoogle = faGoogle;
  readonly faArrowLeft = faArrowLeft;
  readonly faArrowRight = faArrowRight;
  readonly faShieldHalved = faShieldHalved;

  readonly isAdminMode = signal<boolean>(false);
  readonly hidePassword = signal<boolean>(true);

  readonly demoAccounts: DemoAccountViewModel[] = DemoAccountArr.map((acc) => {
    let key = 'sysadmin';
    if (acc.role === Role.LEVEL_1_FINANCE) {
      key = 'finance';
    } else if (acc.role === Role.LEVEL_2_DEAN) {
      key = 'dean';
    } else if (acc.role === Role.LEVEL_3_USER) {
      key = acc.userType === UserType.STUDENT ? 'student' : 'teacher';
    }

    return {
      ...acc,
      translationKey: key,
    };
  });

  readonly selectedAccount = computed<DemoAccountViewModel | null>(() => {
    const currentEmail = this.adminModel().email.trim().toLowerCase();
    if (!currentEmail) return null;
    return this.demoAccounts.find((acc) => acc.email.toLowerCase() === currentEmail) ?? null;
  });

  protected readonly adminModel = signal({
    email: '',
    password: '',
  });

  protected readonly adminLoginForm = form(this.adminModel, (s) => {
    required(s.email);
    email(s.email);
    required(s.password);
  });

  /** Toggles between institutional Google SSO and Evaluator Role Sandbox mode. */
  toggleAdminMode(status: boolean): void {
    this.isAdminMode.set(status);
    this.hidePassword.set(true);
    if (!status) {
      this.adminLoginForm().reset();
    }
  }

  /** Populates credentials when an evaluator selects a preset sandbox role. */
 onRoleSelectionChanged(account: DemoAccountViewModel | null): void {
    if (account) {
      this.adminModel.set({
        email: account.email,
        password: account.password,
      });
    } else {
      this.adminLoginForm().reset();
    }
  }

  /** Navigates to the public architectural showcase page. */
  navigateToOverview(): void {
    this.router.navigate(['/project-overview']);
  }

  /** Executes Google Workspace OAuth authentication flow. */
  async onGoogleLoginTriggered(): Promise<void> {
    if (this.authService.isSystemLoading()) return;

    try {
      const res = (await this.authService.signInWithGoogleAccount()) as LoginResponse;
      this.updateTokenAndReRoute(res.token, res.user);
    } catch (err: any) {
      console.warn('Google OAuth authentication flow intercepted:', err);

      if (err.status === 403 && err.error?.errorCode === 'AUTH_ACCOUNT_RESTRICTED') {
        return;
      }

      if (err.status === 401 || err.status === 403) return;

      this.errorModalService.openErrorModal(err);
    }
  }

  /** Submits sandbox or administrative email/password credentials. */
  onAdminLoginSubmitted(): void {
    if (this.authService.isSystemLoading()) return;

    submit(this.adminLoginForm, async () => {
      const { email, password } = this.adminModel();

      try {
        const res = await this.authService.signInWithUserAccount(email, password);
        this.updateTokenAndReRoute(res.token, res.user);
      } catch (err: any) {
        console.warn('Admin credential authentication flow intercepted:', err);
        if (err.status === 401 || err.status === 403) return;
        this.errorModalService.openErrorModal(err);
      }
    });
  }

  /** Persists session state and routes users according to their account lifecycle status. */
  updateTokenAndReRoute(token: string, user: UserBase): void {
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
}