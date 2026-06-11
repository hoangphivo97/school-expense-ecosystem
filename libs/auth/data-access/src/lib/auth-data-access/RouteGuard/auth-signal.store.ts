import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserBase } from '@school-expense-ecosystem/auth/types'; 

@Injectable({ providedIn: 'root' })
export class AuthSignalStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Private reactive core signals holding reactive state layers
   */
  private readonly tokenSignal = signal<string | null>(this.getHydratedToken());
  private readonly userSignal = signal<UserBase | null>(this.getHydratedUser());

  /**
   * Public read-only signals exposed to guards and components
   */
  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());

  private getHydratedToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token'); //
  }

  private getHydratedUser(): UserBase | null {
    if (!this.isBrowser) return null;
    const token = localStorage.getItem('token'); //
    return token ? this.decodeTokenPayload(token) : null; //
  }

  /**
   * Synchronizes authentication metrics and atomic client persistent properties simultaneously
   */
  saveSession(token: string | null, user?: UserBase | null): void {
    const resolvedUser = user !== undefined ? user : (token ? this.decodeTokenPayload(token) : null);

    this.tokenSignal.set(token);
    this.userSignal.set(resolvedUser);

    if (this.isBrowser) {
      if (token) {
        localStorage.setItem('token', token); //
      } else {
        localStorage.removeItem('token'); //
      }
    }
  }

  private decodeTokenPayload(token: string): UserBase | null {
    try {
      const payloadPart = token.split('.')[1]; //
      const decodedJson = atob(payloadPart); //
      return JSON.parse(decodedJson) as UserBase; //
    } catch (error) {
      return null; //
    }
  }
}