import { Injectable, inject } from '@angular/core'; // Added inject import
import { Query } from '@datorama/akita';
import { AuthStore, AuthState } from './auth.store';
import { Observable } from 'rxjs';
import { UserBase } from '@school-expense-ecosystem/auth/types';

@Injectable({ providedIn: 'root' })
export class AuthQuery extends Query<AuthState> {
  token$: Observable<string | null> = this.select('token');
  user$: Observable<UserBase | null> = this.select('user');

  constructor() {
    super(inject(AuthStore));
  }
}