import { Component, inject, NgZone, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { MatCard, MatCardContent, MatCardFooter, MatCardHeader, MatCardModule, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faArrowLeft, faArrowRight, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { MatOption, MatSelect } from '@angular/material/select';

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  description: string;
}

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatError,
    MatProgressSpinner,
    MatCardTitle,
    MatButton,
    FontAwesomeModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatCardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // Utilizing standard inject token patterns instead of bloated constructors
  private readonly fb = inject(NonNullableFormBuilder); // Upgraded to NonNullable for strict typing
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthSignalStore);
  private readonly errorModalService = inject(ErrorModalService);
  private readonly zone = inject(NgZone);

  readonly faGoogle = faGoogle;
  readonly faArrowLeft = faArrowLeft
  readonly faArrowRight = faArrowRight
  readonly faShieldHalved = faShieldHalved

  // Modern UI architecture: Using Signals for lightweight, reactive state tracking
  readonly isAdminMode = signal<boolean>(false);
  readonly selectedAccount = signal<DemoAccount | null>(null);

  readonly demoAccounts: DemoAccount[] = [
    {
      role: 'Professor / Department Approver',
      email: 'professor.demo@ntust.edu.tw',
      password: 'DemoPassword123',
      description: 'Reviews, approves or rejects student expense and lab research requests.'
    },
    {
      role: 'Finance Officer / Accountant',
      email: 'finance.staff@ntust.edu.tw',
      password: 'DemoPassword123',
      description: 'Manages university budgets, verifies invoices, and executes payouts.'
    },
    {
      role: 'System Administrator',
      email: 'sysadmin.core@ntust.edu.tw',
      password: 'DemoPassword123',
      description: 'Full global access to audit logs, system parameters, and system rules.'
    }
  ];

  // Dedicated Form configuration for the hidden Admin Console fallback
  readonly adminLoginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required], // Fixed casing typo from 'passWord'
  });

  // Clean Code Getters mapping directly to the template validation blocks
  get emailControl() {
    return this.adminLoginForm.get('email');
  }

  get passwordControl() {
    return this.adminLoginForm.get('password');
  }

  /**
   * Toggles the view context between Public Google OAuth and Admin Form
   */
  toggleAdminMode(status: boolean): void {
    this.isAdminMode.set(status);
    if (!status) {
      this.adminLoginForm.reset(); // Purges typed admin credentials when swapping views
    }
  }

  onRoleSelectionChanged(account: DemoAccount | null): void {
    this.selectedAccount.set(account);

    if (account) {
      this.adminLoginForm.patchValue({
        email: account.email,
        password: account.password
      });
    } else {
      this.adminLoginForm.reset();
    }
  }

  /**
   * Domain Action: Triggers the primary Google Workspace OAuth authentication flow
   */
  async onGoogleLoginTriggered(): Promise<void> {
    if (this.authService.isSystemLoading()) return;

    try {
      const res = await this.authService.signInWithGoogleAccount();
      this.updateTokenAndReRoute(res.token, res.user);
    } catch (err: any) {
      console.warn('Google OAuth authentication flow intercepted:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        this.zone.run(() => {
        });
        return;
      }

      this.errorModalService.openErrorModal(err);
    }
  }
  /**
   * Domain Action: Validates and processes explicitly created Admin accounts
   */
  async onAdminLoginSubmitted(): Promise<void> {
    if (this.adminLoginForm.invalid) {
      this.adminLoginForm.markAllAsTouched();
      return;
    }
    if (this.authService.isSystemLoading()) return;

    const { email, password } = this.adminLoginForm.getRawValue();

    try {
      const res = await this.authService.signInWithUserAccount(email, password);
      this.updateTokenAndReRoute(res.token, res.user);
    } catch (err: any) {
      this.errorModalService.openErrorModal(err);
    }
  }

  /**
   * Reused Core Logic: Dispatches global state updates and coordinates application routing
   */
  updateTokenAndReRoute(token: string, user: any): void {
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