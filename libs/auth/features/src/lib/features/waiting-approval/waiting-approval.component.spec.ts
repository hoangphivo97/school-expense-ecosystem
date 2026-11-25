import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, signal, WritableSignal } from '@angular/core';
import { AuthRealtimeService, AuthService } from '@school-expense-ecosystem/auth/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { enAuth, twAuth } from '@school-expense-ecosystem/shared/assets';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';
import { WaitingApprovalComponent } from './waiting-approval.component';

describe('WaitingApprovalComponent', () => {
  let component: WaitingApprovalComponent;
  let fixture: ComponentFixture<WaitingApprovalComponent>;

  let mockUserSignal: WritableSignal<UserBase | null>;
  let mockAuthRealtimeService: { watchStatusAsSignal: jest.Mock };
  let mockAuthService: { signOut: jest.Mock };

  beforeEach(async () => {
    mockUserSignal = signal<UserBase | null>(
      createMockAuthenticatedUser({
        uid: 'pending-user-01',
        fullName: 'Lin Wei-Ting',
        email: 'weiting@ntust.edu.tw',
        status: UserStatus.PENDING,
      })
    );

    mockAuthRealtimeService = {
      watchStatusAsSignal: jest.fn(),
    };

    mockAuthService = {
      signOut: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        WaitingApprovalComponent,
        provideSharedTranslocoTesting({
          en: { auth: enAuth },
          tw: { auth: twAuth },
        }),
      ],
      providers: [
        { provide: AuthRealtimeService, useValue: mockAuthRealtimeService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and subscribe to realtime account status updates for the active user', () => {
    expect(component).toBeTruthy();
    expect(mockAuthRealtimeService.watchStatusAsSignal).toHaveBeenCalledTimes(1);
    expect(mockAuthRealtimeService.watchStatusAsSignal).toHaveBeenCalledWith(
      'pending-user-01',
      expect.any(Injector)
    );
  });

  it('should expose user display name and email with safe fallbacks when user state is null', () => {
    expect(component.displayName()).toBe('Lin Wei-Ting');
    expect(component.displayEmail()).toBe('weiting@ntust.edu.tw');

    mockUserSignal.set(null);

    expect(component.displayName()).toBe('Valued Educator');
    expect(component.displayEmail()).toBe('N/A');
  });

  it('should delegate logout action to AuthService', () => {
    component.handleLogout();

    expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
  });
});