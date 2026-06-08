import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { UserBase } from '@school-expense-ecosystem/auth/types';

export interface AuthState {
  token: string | null;
  user: UserBase | null
}

function decodeTokenPayload(token: string): UserBase | null {
  try {
    const payloadPart = token.split('.')[1];
    const decodedJson = atob(payloadPart);
    return JSON.parse(decodedJson) as UserBase;
  } catch (error) {
    return null;
  }
}

export function createInitialState(): AuthState {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem('token') || null : null;

  return {
    token,
    user: token ? decodeTokenPayload(token) : null,
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth' })
export class AuthStore extends Store<AuthState> {
  constructor() {
    super(createInitialState());
  }

  setToken(token: string | null) {
    const user = token ? decodeTokenPayload(token) : null;

    this.update({ token, user });

    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}
