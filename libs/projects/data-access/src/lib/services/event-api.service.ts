import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient, HttpParams, httpResource, HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEventPayload,
  Event,
  EventQueryPayload,
  GenerateJoinCodePayload,
  JoinByCodePayload,
  ManageParticipantsPayload,
  StudentSummary,
  UpdateEventPayload,
} from '@school-expense-ecosystem/projects/types';

@Injectable({
  providedIn: 'root',
})

export class EventApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/events';

  /**
   * Fetch paginated list of events with filters
   */
  getEventsResource(
    querySignal: Signal<EventQueryPayload>
  ): HttpResourceRef<{ items: Event[]; total: number } | undefined> {
    return httpResource<{ items: Event[]; total: number }>(() => {
      const query = querySignal();
      const params = new URLSearchParams();

      if (query.page) params.set('page', query.page.toString());
      if (query.limit) params.set('limit', query.limit.toString());
      if (query.search) params.set('search', query.search);
      if (query.facultyId) params.set('facultyId', query.facultyId);
      if (query.status) params.set('status', query.status);
      if (query.projectId) params.set('projectId', query.projectId);

      const queryString = params.toString();
      return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    });
  }

  /**
   * Create a new event
   */
  createEvent(payload: CreateEventPayload): Observable<Event> {
    return this.http.post<Event>(this.baseUrl, payload);
  }

  /**
   * Update event details
   */
  updateEvent(id: string, payload: UpdateEventPayload): Observable<Event> {
    return this.http.patch<Event>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Generate or update join invitation code
   */
  generateJoinCode(id: string, payload: GenerateJoinCodePayload): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/join-code`, payload);
  }

  /**
   * Student join event via code
   */
  joinByCode(id: string, payload: JoinByCodePayload): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/join`, payload);
  }

  /**
   * Reject / Cancel event
   */
  rejectEvent(id: string, reason: string): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  /**
   * Soft archive event
   */
  archiveEvent(id: string): Observable<Event> {
    return this.http.patch<Event>(`${this.baseUrl}/${id}/archive`, {});
  }

  /**
   * Search student accounts for manual roster addition
   */
  searchStudents(query: string): Observable<StudentSummary[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<StudentSummary[]>(`${this.baseUrl}/students/search`, { params });
  }

  /**
   * Add students to event manually
   */
  addStudents(id: string, payload: ManageParticipantsPayload): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/students`, payload);
  }

  /**
   * Remove a student from event roster
   */
  removeStudent(id: string, studentUid: string): Observable<Event> {
    return this.http.delete<Event>(`${this.baseUrl}/${id}/students/${studentUid}`);
  }
}