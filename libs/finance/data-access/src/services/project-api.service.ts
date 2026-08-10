import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateProjectPayload, GenerateJoinCodePayload, JoinProjectByCodePayload, Project, ProjectJoinConfig } from '@school-expense-ecosystem/finance/types';
import { inject, Injectable } from '@angular/core';
import { SharedFilterFields } from '@school-expense-ecosystem/shared/types';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/finance/projects';

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

    return this.http.get<Project[]>(this.baseUrl, { params });
  }

  /**
   * Fetch single project details by ID
   */
  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new project (Teacher / Dean / Finance)
   */
  createProject(payload: CreateProjectPayload): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, payload);
  }

  /**
   * Generate or reset invitation join code (Teacher / Dean)
   */
  generateJoinCode(projectId: string, payload: GenerateJoinCodePayload): Observable<ProjectJoinConfig> {
    return this.http.post<ProjectJoinConfig>(`${this.baseUrl}/${projectId}/join-code`, payload);
  }

  /**
   * Enroll current student into a project via Join Code
   */
  joinProjectByCode(payload: JoinProjectByCodePayload): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/join-by-code`, payload);
  }

  /**
   * Approve pending project funding (Dean / Finance)
   */
  approveProject(projectId: string): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${projectId}/approve`, {});
  }
}