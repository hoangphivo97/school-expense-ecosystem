import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { Router } from '@angular/router';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { TranslocoTestingModule } from '@ngneat/transloco';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const mockRouter = {
    navigate: jest.fn()
  };

  const mockAuthService = {
    isSystemLoading: jest.fn(() => false),
    signInWithUserAccount: jest.fn<(email: string, password: string) => Promise<any>>(),
    signInWithGoogleAccount: jest.fn(),
    isLoggingInWithGoogle: jest.fn(() => false),
    isLoggingInWithEmail: jest.fn(() => false)
  };

  const mockAuthSignalStore = {
    updateAuthState: jest.fn()
  };

  const mockErrorModalService = {
    openErrorModal: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        // Configures a minimal runtime inline isolation dictionary context for testing
        TranslocoTestingModule.forRoot({
          langs: { en: {}, 'zh-TW': {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en', 'zh-TW'] }
        })
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthSignalStore, useValue: mockAuthSignalStore },
        { provide: ErrorModalService, useValue: mockErrorModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    jest.clearAllMocks();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should structuralize form fields matching schema configuration definition', () => {
    const formInstance = (component as any).adminLoginForm;
    expect(formInstance.email).toBeDefined();
    expect(formInstance.password).toBeDefined();
  });

  it('should route user to dashboard upon valid admin credentials with ACTIVE status', async () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: { uid: 'admin-123', status: UserStatus.ACTIVE }
    };
    mockAuthService.signInWithUserAccount.mockResolvedValue(mockLoginResponse);

    (component as any).adminModel.set({
      email: 'admin@ntust.edu.tw',
      password: 'secure_password'
    });

    component.onAdminLoginSubmitted();
    await fixture.whenStable();

    expect(mockAuthService.signInWithUserAccount).toHaveBeenCalledWith('admin@ntust.edu.tw', 'secure_password');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should intercept credential authentication errors gracefully without routing matching 401 response', async () => {
    const mockApiError = { status: 401, error: { message: 'Unauthorized access' } };
    mockAuthService.signInWithUserAccount.mockRejectedValue(mockApiError);

    (component as any).adminModel.set({
      email: 'invalid@ntust.edu.tw',
      password: 'wrong_password'
    });

    component.onAdminLoginSubmitted();
    await fixture.whenStable();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});