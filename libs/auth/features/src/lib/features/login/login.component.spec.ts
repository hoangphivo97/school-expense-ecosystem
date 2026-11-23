import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { enAuth, twAuth } from '@school-expense-ecosystem/shared/assets';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';
import { LoginComponent } from './login.component';
import { LoginCaseStudyComponent } from '@school-expense-ecosystem/auth/ui';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  // Reactive loading signals
  let mockSystemLoadingSignal: WritableSignal<boolean>;
  let mockGoogleLoadingSignal: WritableSignal<boolean>;
  let mockEmailLoadingSignal: WritableSignal<boolean>;

  // Service and Router mocks
  let mockRouter: { navigate: jest.Mock };
  let mockAuthService: {
    isSystemLoading: WritableSignal<boolean>;
    isLoggingInWithGoogle: WritableSignal<boolean>;
    isLoggingInWithEmail: WritableSignal<boolean>;
    signInWithUserAccount: jest.Mock;
    signInWithGoogleAccount: jest.Mock;
  };
  let mockAuthSignalStore: { updateAuthState: jest.Mock };
  let mockErrorModalService: { openErrorModal: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    // 1. Initialize reactive state mocks
    mockSystemLoadingSignal = signal(false);
    mockGoogleLoadingSignal = signal(false);
    mockEmailLoadingSignal = signal(false);

    // 2. Initialize service doubles
    mockRouter = {
      navigate: jest.fn(),
    };

    mockAuthService = {
      isSystemLoading: mockSystemLoadingSignal,
      isLoggingInWithGoogle: mockGoogleLoadingSignal,
      isLoggingInWithEmail: mockEmailLoadingSignal,
      signInWithUserAccount: jest.fn(),
      signInWithGoogleAccount: jest.fn(),
    };

    mockAuthSignalStore = {
      updateAuthState: jest.fn(),
    };

    mockErrorModalService = {
      openErrorModal: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        provideSharedTranslocoTesting({
          en: { auth: enAuth },
          tw: { auth: twAuth },
        }),
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthSignalStore, useValue: mockAuthSignalStore },
        { provide: ErrorModalService, useValue: mockErrorModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Schema & Sandbox State Synchronization', () => {
    it('should initialize signal form fields matching schema definition', () => {
      const formInstance = (component as unknown as { adminLoginForm: Record<string, unknown> })
        .adminLoginForm;

      expect(formInstance['email']).toBeDefined();
      expect(formInstance['password']).toBeDefined();
    });

    it('should derive selectedAccount reactively as single source of truth when presets change', () => {
      const samplePreset = component.demoAccounts[0];

      component.onRoleSelectionChanged(samplePreset);
      expect(component.selectedAccount()?.email).toBe(samplePreset.email);
      expect(component.selectedAccount()?.translationKey).toBe(samplePreset.translationKey);

      // Clearing preset selection resets both form model and derived account metadata
      component.onRoleSelectionChanged(null);
      expect(component.selectedAccount()).toBeNull();
    });

    it('should reset sandbox mode, password visibility, and selected preset when returning to Google portal', () => {
      const samplePreset = component.demoAccounts[0];

      component.toggleAdminMode(true);
      component.hidePassword.set(false);
      component.onRoleSelectionChanged(samplePreset);

      expect(component.isAdminMode()).toBe(true);
      expect(component.selectedAccount()).not.toBeNull();

      component.toggleAdminMode(false);

      expect(component.isAdminMode()).toBe(false);
      expect(component.hidePassword()).toBe(true);
      expect(component.selectedAccount()).toBeNull();
    });
  });

  describe('Google SSO & Credential Authentication Flows', () => {
    it('should authenticate via Google SSO, update store state, and route ACTIVE users to /dashboard', async () => {
      const activeUser = createMockAuthenticatedUser({
        uid: 'google-user-01',
        status: UserStatus.ACTIVE,
      });
      mockAuthService.signInWithGoogleAccount.mockResolvedValue({
        token: 'mock-google-jwt',
        user: activeUser,
      });

      await component.onGoogleLoginTriggered();

      expect(mockAuthService.signInWithGoogleAccount).toHaveBeenCalledTimes(1);
      expect(mockAuthSignalStore.updateAuthState).toHaveBeenCalledWith('mock-google-jwt', activeUser);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should ignore Google login triggers while system loading is active', async () => {
      mockSystemLoadingSignal.set(true);

      await component.onGoogleLoginTriggered();

      expect(mockAuthService.signInWithGoogleAccount).not.toHaveBeenCalled();
    });

    it('should silently ignore 401/403 responses and open error modal on unexpected Google SSO failures', async () => {
      mockAuthService.signInWithGoogleAccount.mockRejectedValueOnce({
        status: 403,
        error: { errorCode: 'AUTH_ACCOUNT_RESTRICTED' },
      });
      await component.onGoogleLoginTriggered();
      expect(mockErrorModalService.openErrorModal).not.toHaveBeenCalled();

      const serverError = { status: 500, message: 'Firebase OAuth timeout' };
      mockAuthService.signInWithGoogleAccount.mockRejectedValueOnce(serverError);
      await component.onGoogleLoginTriggered();
      expect(mockErrorModalService.openErrorModal).toHaveBeenCalledWith(serverError);
    });

    it('should route user to dashboard upon valid sandbox/admin credentials with ACTIVE status', async () => {
      const activeAdmin = createMockAuthenticatedUser({
        uid: 'admin-123',
        status: UserStatus.ACTIVE,
      });
      mockAuthService.signInWithUserAccount.mockResolvedValue({
        token: 'mock-jwt-token',
        user: activeAdmin,
      });

      component.onRoleSelectionChanged({
        ...component.demoAccounts[0],
        email: 'admin@ntust.edu.tw',
        password: 'secure_password',
      });

      component.onAdminLoginSubmitted();
      await fixture.whenStable();

      expect(mockAuthService.signInWithUserAccount).toHaveBeenCalledWith(
        'admin@ntust.edu.tw',
        'secure_password'
      );
      expect(mockAuthSignalStore.updateAuthState).toHaveBeenCalledWith('mock-jwt-token', activeAdmin);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should intercept credential authentication errors gracefully without routing on 401 response', async () => {
      mockAuthService.signInWithUserAccount.mockRejectedValue({
        status: 401,
        error: { message: 'Unauthorized access' },
      });

      component.onRoleSelectionChanged({
        ...component.demoAccounts[0],
        email: 'invalid@ntust.edu.tw',
        password: 'wrong_password',
      });

      component.onAdminLoginSubmitted();
      await fixture.whenStable();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockErrorModalService.openErrorModal).not.toHaveBeenCalled();
    });
  });

  describe('Account Lifecycle Routing', () => {
    it('should route ONBOARDING users to /auth/onboarding', () => {
      const onboardingUser = createMockAuthenticatedUser({ status: UserStatus.ONBOARDING });

      component.updateTokenAndReRoute('token-onboarding', onboardingUser);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/onboarding']);
    });

    it('should route PENDING users to /auth/waiting-approval', () => {
      const pendingUser = createMockAuthenticatedUser({ status: UserStatus.PENDING });

      component.updateTokenAndReRoute('token-pending', pendingUser);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/waiting-approval']);
    });

    it('should fallback to /auth when user payload is missing or has an unhandled status', () => {
      component.updateTokenAndReRoute('token-empty', null as unknown as UserBase);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth']);
    });
  });

  describe('Conditional UI Rendering & Case Study Integration', () => {
    it('should switch rendered templates between Google SSO and Sandbox login form', () => {
      const host: HTMLElement = fixture.nativeElement;

      expect(host.querySelector('.google-btn')).not.toBeNull();
      expect(host.querySelector('#auth-email')).toBeNull();

      component.toggleAdminMode(true);
      fixture.detectChanges();

      expect(host.querySelector('.google-btn')).toBeNull();
      expect(host.querySelector('#auth-email')).not.toBeNull();
    });

    it('should navigate to /project-overview when LoginCaseStudyComponent emits exploreDossier', () => {
      const caseStudyDebugEl = fixture.debugElement.query(By.directive(LoginCaseStudyComponent));
      expect(caseStudyDebugEl).not.toBeNull();

      caseStudyDebugEl.componentInstance.exploreDossier.emit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/project-overview']);
    });
  });
});