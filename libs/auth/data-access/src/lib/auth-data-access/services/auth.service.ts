import { computed, inject, Injectable, resource, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  AuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { firstValueFrom, from, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginResponse, OnboardingData, OnboardingResponse } from '@school-expense-ecosystem/auth/types';
import { AuthSignalStore } from '../RouteGuard/auth-signal.store';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private readonly baseUrl = inject(API_BASE_URL);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthSignalStore)

  private apiUrl = `${this.baseUrl}/api/auth`;

  readonly isAuthInitializing = signal<boolean>(true);

  readonly isLoggingInWithEmail = signal<boolean>(false);
  readonly isLoggingInWithGoogle = signal<boolean>(false);
  readonly isOnboardingSubmitting = signal<boolean>(false);

  readonly isSystemLoading = computed(() =>
    this.isAuthInitializing() ||
    this.isLoggingInWithEmail() ||
    this.isLoggingInWithGoogle() ||
    this.isOnboardingSubmitting()
  );

  constructor() {
    onAuthStateChanged(this.auth, () => {
      this.isAuthInitializing.set(false);
    });
  }

  async signInWithUserAccount(email: string, password: string): Promise<LoginResponse> {
    this.isLoggingInWithEmail.set(true);
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      const token = await result.user.getIdToken();

      return await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/login`, { uid: result.user.uid, token })
      );
    } finally {
      // Bọc trong finally để đảm bảo dù thành công hay nổ lỗi, cờ loading LUÔN LUÔN được hạ xuống
      this.isLoggingInWithEmail.set(false);
    }
  }

  async signInWithGoogleAccount(): Promise<any> {
    this.isLoggingInWithGoogle.set(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const token = await result.user.getIdToken();

      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/google-login`, { uid: result.user.uid, token })
      );
    } finally {
      this.isLoggingInWithGoogle.set(false);
    }
  }

  async completeOnboarding(onboardingData: OnboardingData): Promise<OnboardingResponse> {
    this.isOnboardingSubmitting.set(true);
    try {
      return await firstValueFrom(
        this.http.post<OnboardingResponse>(`${this.apiUrl}/onboarding`, onboardingData)
      );
    } finally {
      this.isOnboardingSubmitting.set(false);
    }
  }
  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Backend sign-out failed:', error);
    } finally {
      this.authStore.updateAuthState(null, null);
      this.router.navigate(['/auth']);
    }
  }

  getFirebaseToken(forceRefresh = false) {
    const user = this.auth.currentUser;
    return user ? user.getIdToken(forceRefresh) : '';
  }
}
