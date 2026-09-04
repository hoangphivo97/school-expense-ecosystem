import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { CreateProjectPayload, GenerateJoinCodePayload, JoinByCodePayload, JoinConfig, ProjectItem, ProjectQueryPayload, StudentSummary, UpdateProjectPayload } from '@school-expense-ecosystem/projects/types';

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
  getProjectsResource(queryFn?: () => ProjectQueryPayload | undefined) {
    return httpResource<{ items: ProjectItem[]; total: number }>(() => {
      const query = queryFn ? queryFn() : undefined;
      const params: Record<string, string> = {};

      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params[key] = String(value);
          }
        });
      }

      return {
        url: this.apiUrl,
        params,
      };
    }, {
      defaultValue: { items: [], total: 0 },
    });
  }

  /**
   * Fetch single project details by ID
   */
  getProjectByIdResource(idFn: () => string | null | undefined) {
    return httpResource<ProjectItem | null>(() => {
      const id = idFn();
      return id ? `${this.apiUrl}/${id}` : undefined;
    }, {
      defaultValue: null,
    });
  }

  /**
   * Create a new project (Teacher / Dean / Finance)
   */
  createProject(payload: CreateProjectPayload): Observable<ProjectItem> {
    return this.http.post<ProjectItem>(this.apiUrl, payload);
  }

  archiveProject(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/archive`, {});
  }

  updateProject(id: string, payload: UpdateProjectPayload): Observable<ProjectItem> {
    return this.http.patch<ProjectItem>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Generate or reset invitation join code (Teacher / Dean)
   */
  generateJoinCode(projectId: string, payload: GenerateJoinCodePayload): Observable<JoinConfig> {
    return this.http.post<JoinConfig>(`${this.apiUrl}/${projectId}/join-code`, payload);
  }

  /**
   * Enroll current student into a project via Join Code
   */
  joinProjectByCode(payload: JoinByCodePayload): Observable<ProjectItem> {
    return this.http.post<ProjectItem>(`${this.apiUrl}/join`, payload);
  }

searchStudents(query: string): Observable<StudentSummary[]> {
  const params = new HttpParams().set('query', query.trim());
  return this.http.get<StudentSummary[]>(`${this.apiUrl}/students/search`, { params });
}

  /**
   * Approve pending project funding (Dean / Finance)
   */
  approveProject(id: string): Observable<ProjectItem> {
    return this.http.patch<ProjectItem>(`${this.apiUrl}/${id}/approve`, {});
  }

  addStudents(projectId: string, studentIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/students`, { studentIds });
  }

  removeStudent(projectId: string, studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/students/${studentId}`);
  }

  rejectProject(id: string, reason?: string): Observable<ProjectItem> {
    return this.http.patch<ProjectItem>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  getProjectStudents(projectId: string):Observable<StudentSummary[]>{
    return this.http.get<StudentSummary[]>(`${this.apiUrl}/${projectId}/students`);
  }
}