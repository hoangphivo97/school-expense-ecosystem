import { Injectable, signal, computed } from '@angular/core';
import { UserBase } from '@school-expense-ecosystem/auth/types';

@Injectable({ providedIn: 'root' })
export class AuthSignalStore {

  /**
   * Private reactive core signals holding reactive state layers
   */
  private readonly userSignal = signal<UserBase | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  /**
   * Public read-only signals exposed to guards and components
   */
  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();

  readonly isAuthenticated = computed(() => !!this.userSignal());

  constructor() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        this.updateAuthState(token, this.decodeTokenPayload(token));
      }
    }
  }

  /**
   * Synchronizes authentication metrics and atomic client persistent properties simultaneously
   */
  updateAuthState(token: string | null, user?: UserBase | null): void {
    const resolvedUser = user !== undefined ? user : (token ? this.decodeTokenPayload(token) : null);

    this.tokenSignal.set(token);
    this.userSignal.set(resolvedUser);

    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  private decodeTokenPayload(token: string): UserBase | null {
    try {
      const payloadPart = token.split('.')[1];
      const decodedJson = atob(payloadPart);
      return JSON.parse(decodedJson) as UserBase;
    } catch {
      return null;
    }
  }
}