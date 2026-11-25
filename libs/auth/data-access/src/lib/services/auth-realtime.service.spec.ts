import { docData, Firestore } from '@angular/fire/firestore';
import { firstValueFrom, Subject } from 'rxjs';
import { AuthRealtimeService } from './auth-realtime.service';
import { AuthService } from './auth.service';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';
import { TestBed } from '@angular/core/testing';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  doc: jest.fn(() => ({ path: 'users/user-01' })),
  docData: jest.fn(),
}));

describe('AuthRealtimeService', () => {
  let service: AuthRealtimeService;
  let userDoc$: Subject<Partial<UserBase>>;
  let mockAuthService: { restoreOrRefreshSession: jest.Mock };
  let mockAuthStore: { updateAuthState: jest.Mock };

  beforeEach(() => {
    userDoc$ = new Subject<Partial<UserBase>>();
    (docData as jest.Mock).mockReturnValue(userDoc$.asObservable());

    mockAuthService = {
      restoreOrRefreshSession: jest.fn(),
    };

    mockAuthStore = {
      updateAuthState: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthRealtimeService,
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthSignalStore, useValue: mockAuthStore },
      ],
    });

    service = TestBed.inject(AuthRealtimeService);
  });

  afterEach(() => {
    userDoc$.complete();
    jest.clearAllMocks();
  });

  it('should ignore PENDING snapshots and emit ACTIVATED after refreshing session token', async () => {
    mockAuthService.restoreOrRefreshSession.mockResolvedValue('fresh-jwt-token');

    const outcomePromise = firstValueFrom(service.watchApprovalOutcome('user-01'));

    userDoc$.next({ uid: 'user-01', status: UserStatus.PENDING });
    expect(mockAuthService.restoreOrRefreshSession).not.toHaveBeenCalled();

    const activeUser = { uid: 'user-01', status: UserStatus.ACTIVE } as UserBase;
    userDoc$.next(activeUser);

    await expect(outcomePromise).resolves.toEqual({
      status: 'ACTIVATED',
      user: activeUser,
    });
    expect(mockAuthService.restoreOrRefreshSession).toHaveBeenCalledTimes(1);
  });

  it('should emit FE_SESSION_EXPIRED when session refresh returns null', async () => {
    mockAuthService.restoreOrRefreshSession.mockResolvedValue(null);

    const outcomePromise = firstValueFrom(service.watchApprovalOutcome('user-01'));
    userDoc$.next({ uid: 'user-01', status: UserStatus.ACTIVE });

    await expect(outcomePromise).resolves.toEqual({ status: 'FE_SESSION_EXPIRED' });
  });

  it('should clear auth state and emit REJECTED when account is rejected', async () => {
    const outcomePromise = firstValueFrom(service.watchApprovalOutcome('user-01'));

    userDoc$.next({
      uid: 'user-01',
      status: UserStatus.REJECTED,
      reason: 'Invalid faculty credentials.',
    });

    await expect(outcomePromise).resolves.toEqual({
      status: 'REJECTED',
      reason: 'Invalid faculty credentials.',
    });
    expect(mockAuthStore.updateAuthState).toHaveBeenCalledWith(null, null);
  });
});