import { inject, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { Faculty } from '@school-expense-ecosystem/shared/types';

@Injectable({
  providedIn: 'root',
})
export class FacultyApiService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/faculties`;

  readonly facultiesResource = httpResource<Faculty[]>(() => this.apiUrl, {
    defaultValue: [],
  });

}