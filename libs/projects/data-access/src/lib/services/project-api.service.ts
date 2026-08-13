import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { SharedFilterFields } from '@school-expense-ecosystem/shared/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateProjectPayload, GenerateJoinCodePayload, JoinProjectByCodePayload, Project, ProjectJoinConfig } from '@school-expense-ecosystem/projects/types';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/projects-manager`;

  /**
   * Fetch context-aware project list (Finance, Dean, Teacher, or Student)
   */
  getProjects(filters?: SharedFilterFields): Observable<Project[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<Project[]>(this.apiUrl, { params });
  }

  /**
   * Fetch single project details by ID
   */
  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new project (Teacher / Dean / Finance)
   */
  createProject(payload: CreateProjectPayload): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, payload);
  }

  /**
   * Generate or reset invitation join code (Teacher / Dean)
   */
  generateJoinCode(projectId: string, payload: GenerateJoinCodePayload): Observable<ProjectJoinConfig> {
    return this.http.post<ProjectJoinConfig>(`${this.apiUrl}/${projectId}/join-code`, payload);
  }

  /**
   * Enroll current student into a project via Join Code
   */
  joinProjectByCode(payload: JoinProjectByCodePayload): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/join-by-code`, payload);
  }

  /**
   * Approve pending project funding (Dean / Finance)
   */
  approveProject(projectId: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}/approve`, {});
  }
}