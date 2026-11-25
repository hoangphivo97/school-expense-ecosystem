import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { AuthService } from './auth.service';

jest.mock('@angular/fire/auth', () => ({
  Auth: class {},
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockAuth: {
    currentUser: unknown;
    authStateReady: jest.Mock;
    signOut: jest.Mock;
  };
  let mockRouter: { navigate: jest.Mock };
  let mockAuthStore: { updateAuthState: jest.Mock };

  beforeEach(() => {
    mockAuth = {
      currentUser: null,
      authStateReady: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    mockAuthStore = {
      updateAuthState: jest.fn(),
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback: () => void) => {
      callback();
      return jest.fn();
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: mockAuth },
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        { provide: Router, useValue: mockRouter },
        { provide: AuthSignalStore, useValue: mockAuthStore },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should be created and complete auth initialization state', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthInitializing()).toBe(false);
  });

  it('should clear auth state and return null in restoreOrRefreshSession when no Firebase user exists', async () => {
    mockAuth.currentUser = null;

    const token = await service.restoreOrRefreshSession();

    expect(token).toBeNull();
    expect(mockAuthStore.updateAuthState).toHaveBeenCalledWith(null, null);
  });

  it('should exchange Firebase token via google-login and update AuthSignalStore for Google users', async () => {
    const mockUser = { uid: 'google-uid-01', email: 'test@ntust.edu.tw' } as UserBase;
    mockAuth.currentUser = {
      uid: 'google-uid-01',
      providerData: [{ providerId: 'google.com' }],
      getIdToken: jest.fn().mockResolvedValue('firebase-id-token'),
    };

    const refreshPromise = service.restoreOrRefreshSession();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/google-login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      uid: 'google-uid-01',
      token: 'firebase-id-token',
    });

    req.flush({ token: 'nestjs-jwt-token', user: mockUser });

    const result = await refreshPromise;
    expect(result).toBe('nestjs-jwt-token');
    expect(mockAuthStore.updateAuthState).toHaveBeenCalledWith('nestjs-jwt-token', mockUser);
  });

  it('should sign out from Firebase, clear auth state, and navigate to /auth', async () => {
    await service.signOut();

    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
    expect(mockAuthStore.updateAuthState).toHaveBeenCalledWith(null, null);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth']);
  });
});