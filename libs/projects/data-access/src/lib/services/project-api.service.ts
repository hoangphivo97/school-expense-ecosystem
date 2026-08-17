import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { SharedFilterFields } from '@school-expense-ecosystem/shared/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateProjectPayload, GenerateJoinCodePayload, JoinProjectByCodePayload, Project, ProjectJoinConfig, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';

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
  getProjects(query?: ProjectQueryPayload): Observable<{ items: Project[]; total: number } | Project[]> {
    let params = new HttpParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<{ items: Project[]; total: number } | Project[]>(this.apiUrl, { params });
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

  archiveProject(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/archive`, {});
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
    return this.http.post<Project>(`${this.apiUrl}/join`, payload);
  }

  /**
   * Approve pending project funding (Dean / Finance)
   */
  approveProject(projectId: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}/approve`, {});
  }

  addStudents(projectId: string, studentIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/students`, { studentIds });
  }

  removeStudent(projectId: string, studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/students/${studentId}`);
  }
}