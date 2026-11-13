import { Injectable, signal, computed } from '@angular/core';
import { UserBase } from '@school-expense-ecosystem/shared/types';

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
  }

  /**
   * Synchronizes authentication metrics and atomic client persistent properties simultaneously
   */
  updateAuthState(token: string | null, user?: UserBase | null): void {
    const resolvedUser =
      user !== undefined ? user : token ? this.decodeTokenPayload(token) : null;

    this.tokenSignal.set(token);
    this.userSignal.set(resolvedUser);
  }

  private decodeTokenPayload(token: string): UserBase | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as UserBase;
    } catch {
      return null;
    }
  }
}