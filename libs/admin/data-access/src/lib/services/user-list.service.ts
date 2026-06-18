import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateUserInput, CreateUserResult } from '@school-expense-ecosystem/admin/types';

export interface PaginatedUsersResponse {
  users: UserBase[];
  nextPageToken: string | null;
  totalItems: number;
}


@Injectable({
  providedIn: 'root',
})
export class UserListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api`;

  getPaginatedUsers(limit: number, pageToken?: string): Observable<PaginatedUsersResponse> {
    let url = `${this.apiUrl}/users?limit=${limit}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    return this.http.get<PaginatedUsersResponse>(url);
  }

  provisionNewUser(dto: CreateUserInput): Observable<CreateUserResult> {
    return this.http.post<CreateUserResult>(`${this.apiUrl}/users/provision`, dto);
  }
}