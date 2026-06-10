import { inject, Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  FacebookAuthProvider,
  AuthProvider,
  User,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { BehaviorSubject, from, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserSession } from '@school-expense-ecosystem/auth/types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private apiUrl = 'http://localhost:3000/auth';
  private apiGoogleUrl = 'http://localhost:3000/auth/google-login';
  private apiFacebookUrl = 'http://localhost:3000/auth/facebook-login';
  private user$ = new BehaviorSubject<User | null>(null);
  private loading$ = new BehaviorSubject<boolean>(true);
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        this.user$.next({
          displayName: user.displayName,
          email: user.email,
        } as User);
      } else {
        this.user$.next(null);
      }
      this.loading$.next(false);
    });
  }

  signInWithUserAccount(
    username: string,
    password: string,
  ): Observable<UserSession> {
    const loginData = { username, password };
    return this.http.post<UserSession>(`${this.apiUrl}/login`, loginData);
  }

  signInWithGoogleAccount(): Observable<object> {
    const provider = new GoogleAuthProvider();

    return this.signInWithProvider(provider, this.apiGoogleUrl);
  }

  // signInWithFacebookAccount(): Observable<object> {
  //   const provider = new FacebookAuthProvider();
  //   provider.addScope('email');

  //   return this.signInWithProvider(provider, this.apiFacebookUrl);
  // }

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
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }

  getIdToken(forceRefresh = false) {
    const user = this.auth.currentUser;
    return user ? user.getIdToken(forceRefresh) : '';
  }

  get isLoading$(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  get userObs$(): Observable<User | null> {
    return this.user$.asObservable();
  }

  get currentUser(): User | null {
    return this.user$.value;
  }
}
