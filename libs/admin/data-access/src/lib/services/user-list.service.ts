import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens'; 


@Injectable({
  providedIn: 'root',
})
export class UserListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/admin/users`;

  /**
   * Kéo danh sách toàn bộ User từ Backend
   */
  getAllUsers(): Observable<UserBase[]> {
    return this.http.get<UserBase[]>(this.apiUrl);
  }
}