import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';

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

  // Sửa đổi Service nhận thêm tham số truyền lên Server
  getPaginatedUsers(limit: number, pageToken?: string): Observable<PaginatedUsersResponse> {
    let url = `${this.apiUrl}/users?limit=${limit}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    return this.http.get<PaginatedUsersResponse>(url);
  }
}