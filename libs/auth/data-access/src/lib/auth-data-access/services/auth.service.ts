import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  AuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { from, Observable, switchMap } from 'rxjs';
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
  readonly isLoading = signal<boolean>(true);

  constructor() {
    onAuthStateChanged(this.auth, () => {
      this.isLoading.set(false);
    });
  }

  signInWithUserAccount(email: string, password: string): Observable<LoginResponse> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((result: UserCredential) =>
        from(result.user.getIdToken()).pipe(
          switchMap((token: string) =>
            this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
              uid: result.user.uid,
              token
            })
          )
        )
      )
    );
  }

  signInWithGoogleAccount(): Observable<object> {
    const provider = new GoogleAuthProvider();

    return this.signInWithProvider(provider, `${this.apiUrl}/google-login`);
  }

  completeOnboarding(onboardingData: OnboardingData): Observable<OnboardingResponse> {
    return this.http.post<OnboardingResponse>(`${this.apiUrl}/onboarding`, onboardingData);
  }

  private signInWithProvider(
    provider: AuthProvider,
    apiUrl: string,
  ): Observable<object> {
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((result: UserCredential) =>
        from(result.user.getIdToken()).pipe(
          switchMap((token: string) =>
            this.http.post(apiUrl, { uid: result.user.uid, token }),
          ),
        ),
      ),
    );
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
