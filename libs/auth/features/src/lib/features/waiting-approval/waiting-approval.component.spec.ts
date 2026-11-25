import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, signal, WritableSignal } from '@angular/core';
import { ApprovalWatchOutcome, AuthRealtimeService, AuthService } from '@school-expense-ecosystem/auth/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { enAuth, twAuth } from '@school-expense-ecosystem/shared/assets';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';
import { WaitingApprovalComponent } from './waiting-approval.component';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

describe('WaitingApprovalComponent', () => {
  let component: WaitingApprovalComponent;
  let fixture: ComponentFixture<WaitingApprovalComponent>;

  let mockUserSignal: WritableSignal<UserBase | null>;
  let mockAuthRealtimeService: { watchApprovalOutcome: jest.Mock };
  let mockAuthService: { signOut: jest.Mock };
  let mockRouter: { navigate: jest.Mock };
  let outcome$: Subject<ApprovalWatchOutcome>;

  beforeEach(async () => {
    mockUserSignal = signal<UserBase | null>(
      createMockAuthenticatedUser({
        uid: 'pending-user-01',
        fullName: 'Lin Wei-Ting',
        email: 'weiting@ntust.edu.tw',
        status: UserStatus.PENDING,
      })
    );

    outcome$ = new Subject<ApprovalWatchOutcome>();

    mockAuthRealtimeService = {
      watchApprovalOutcome: jest.fn(() => outcome$.asObservable()),
    };

    mockAuthService = {
      signOut: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
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
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    outcome$.complete();
  });

  it('should subscribe once to watchApprovalOutcome for the active user UID', () => {
    expect(component).toBeTruthy();
    expect(mockAuthRealtimeService.watchApprovalOutcome).toHaveBeenCalledTimes(1);
    expect(mockAuthRealtimeService.watchApprovalOutcome).toHaveBeenCalledWith('pending-user-01');

    mockUserSignal.set(
      createMockAuthenticatedUser({
        uid: 'pending-user-01',
        fullName: 'Updated Name',
        status: UserStatus.PENDING,
      })
    );
    fixture.detectChanges();

    expect(mockAuthRealtimeService.watchApprovalOutcome).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /dashboard when account outcome is ACTIVATED', () => {
    const activeUser = createMockAuthenticatedUser({
      uid: 'pending-user-01',
      status: UserStatus.ACTIVE,
    });

    outcome$.next({ status: 'ACTIVATED', user: activeUser });

    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /auth/rejected with rejection reason when outcome is REJECTED', () => {
    outcome$.next({
      status: 'REJECTED',
      reason: 'Student ID verification failed.',
    });

    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/rejected'], {
      state: {
        status: UserStatus.REJECTED,
        reason: 'Student ID verification failed.',
      },
    });
  });

  it('should trigger signOut when outcome is FE_SESSION_EXPIRED', () => {
    outcome$.next({ status: 'FE_SESSION_EXPIRED' });

    expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
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