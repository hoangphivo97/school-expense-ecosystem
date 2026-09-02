import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient, HttpParams, httpResource, HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEventPayload,
  EventItem,
  EventQueryPayload,
  GenerateJoinCodePayload,
  JoinByCodePayload,
  JoinConfig,
  ManageParticipantsPayload,
  StudentSummary,
  UpdateEventPayload,
} from '@school-expense-ecosystem/projects/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';

@Injectable({
  providedIn: 'root',
})

export class EventApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/events`;

  /**
   * Fetch paginated list of events with filters
   */
  getEventsResource(
    queryFn?: () => EventQueryPayload | undefined
  ): HttpResourceRef<{ items: EventItem[]; total: number }> {
    return httpResource<{ items: EventItem[]; total: number }>(() => {
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

  getEventByIdResource(idFn: () => string | null | undefined): HttpResourceRef<EventItem | null> {
    return httpResource<EventItem | null>(() => {
      const id = idFn();
      return id ? `${this.apiUrl}/${id}` : undefined;
    }, {
      defaultValue: null,
    });
  }

  /**
   * Create a new event
   */
  createEvent(payload: CreateEventPayload): Observable<EventItem> {
    return this.http.post<EventItem>(this.apiUrl, payload);
  }

  updateEvent(id: string, payload: UpdateEventPayload): Observable<EventItem> {
    return this.http.patch<EventItem>(`${this.apiUrl}/${id}`, payload);
  }

  approveEvent(id: string): Observable<EventItem> {
    return this.http.patch<EventItem>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectEvent(id: string, reason: string): Observable<EventItem> {
    return this.http.patch<EventItem>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  archiveEvent(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/archive`, {});
  }

  generateJoinCode(id: string, payload: GenerateJoinCodePayload): Observable<JoinConfig> {
    return this.http.post<JoinConfig>(`${this.apiUrl}/${id}/join-code`, payload);
  }

  joinByCode(payload: JoinByCodePayload): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.apiUrl}/join`, payload);
  }

  searchStudents(query: string): Observable<StudentSummary[]> {
    const params = new HttpParams().set('query', query.trim());
    return this.http.get<StudentSummary[]>(`${this.apiUrl}/students/search`, { params });
  }

  getEventStudents(id: string): Observable<StudentSummary[]> {
    return this.http.get<StudentSummary[]>(`${this.apiUrl}/${id}/students`);
  }

  addStudents(id: string, payload: ManageParticipantsPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/students`, payload);
  }

  removeStudent(id: string, studentUid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/students/${studentUid}`);
  }
}