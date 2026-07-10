import { inject, Injectable } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStatus } from '@school-expense-ecosystem/shared/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateUserInput, CreateUserResult, DeleteUserPayload, PaginatedUserResult, UpdateUserInput, UserQueryPayload } from '@school-expense-ecosystem/admin/types';

@Injectable({
  providedIn: 'root',
})
export class UserListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/users`;

  getUsersResource(filterFn: () => UserQueryPayload): HttpResourceRef<PaginatedUserResult | undefined> {
    return httpResource<PaginatedUserResult>(() => {
      const payload = filterFn();
      let url = `${this.apiUrl}/?limit=${payload.limit ?? 10}`;
      
      if (payload.pageToken) url += `&pageToken=${encodeURIComponent(payload.pageToken)}`;
      if (payload.searchTerm) url += `&searchTerm=${encodeURIComponent(payload.searchTerm.trim())}`;
      if (payload.role) url += `&role=${payload.role}`;
      if (payload.userType) url += `&userType=${payload.userType}`;
      if (payload.status) url += `&status=${payload.status}`;
      if (payload.facultyId) url += `&facultyId=${payload.facultyId}`;
      
      return url;
    });
  }

  provisionUser(payload: CreateUserInput): Observable<CreateUserResult> {
    return this.http.post<CreateUserResult>(`${this.apiUrl}/provision`, payload);
  }

  updateUser(uid: string, payload: UpdateUserInput): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${uid}`, payload);
  }

  updateUserStatus(uid: string, status: UserStatus, reason?: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${uid}/status`, { status, reason });
  }

  deleteUser(uid: string, payload: DeleteUserPayload): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${uid}`, {
      body: payload
    });
  }
}