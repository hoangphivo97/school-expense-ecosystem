import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserBase, UserStatus } from '@school-expense-ecosystem/auth/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateUserInput, CreateUserResult, UpdateUserInput } from '@school-expense-ecosystem/admin/types';

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
  private readonly apiUrl = `${this.baseUrl}/api/users`;

  getPaginatedUsers(limit: number, pageToken?: string): Observable<PaginatedUsersResponse> {
    let url = `${this.apiUrl}/?limit=${limit}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    return this.http.get<PaginatedUsersResponse>(url);
  }

  provisionUser(dto: CreateUserInput): Observable<CreateUserResult> {
    return this.http.post<CreateUserResult>(`${this.apiUrl}/provision`, dto);
  }

  updateUser(uid: string, payload: UpdateUserInput): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${uid}`, payload);
  }

  updateUserStatus(uid: string, status: UserStatus, reason?: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${uid}/status`, { status, reason });
  }
}