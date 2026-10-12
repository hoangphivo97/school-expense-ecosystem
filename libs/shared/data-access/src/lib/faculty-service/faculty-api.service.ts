import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { DepartmentFundSummary, Faculty, FacultyId } from '@school-expense-ecosystem/shared/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FacultyApiService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/faculties`;
  private readonly http = inject(HttpClient);

  readonly facultiesResource = httpResource<Faculty[]>(() => this.apiUrl, {
    defaultValue: [],
  });

  getDepartmentFundBalance(facultyId: FacultyId, year?: number): Observable<DepartmentFundSummary> {
    let params = new HttpParams().set('facultyId', facultyId);
    if (year) {
      params = params.set('year', year.toString());
    }
    return this.http.get<DepartmentFundSummary>(
      `${this.apiUrl}/${facultyId}/fund-balance`,
      { params }
    );
  }
}