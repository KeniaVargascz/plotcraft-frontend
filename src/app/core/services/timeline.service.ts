import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  TimelineDetail,
  TimelineEvent,
  TimelineEventRelevance,
  TimelineEventType,
  TimelineSummary,
} from '../models/timeline.model';

type TimelineEventQuery = Partial<{
  type: TimelineEventType;
  relevance: TimelineEventRelevance;
  characterId: string;
  chapterId: string;
  worldId: string;
  search: string;
  sort: 'order' | 'type' | 'relevance';
}>;

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/timelines`;

  /* ─── Timelines ─── */

  listMine(): Observable<TimelineSummary[]> {
    return this.http.get<ApiResponse<TimelineSummary[]>>(this.baseUrl).pipe(map((r) => r.data));
  }

  create(payload: { name: string; description?: string; novelId?: string }) {
    return this.http
      .post<ApiResponse<TimelineDetail>>(this.baseUrl, payload)
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<TimelineDetail> {
    return this.http
      .get<ApiResponse<TimelineDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  update(id: string, payload: Partial<{ name: string; description: string | null }>) {
    return this.http
      .patch<ApiResponse<TimelineDetail>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  remove(id: string, confirm?: boolean) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`, {
        body: { confirm },
      })
      .pipe(map((r) => r.data));
  }

  getByNovelSlug(slug: string) {
    return this.http
      .get<ApiResponse<TimelineDetail>>(`${environment.apiUrl}/novels/${slug}/timeline`)
      .pipe(map((r) => r.data));
  }

  /* ─── Events ─── */

  listEvents(timelineId: string, query?: TimelineEventQuery): Observable<TimelineEvent[]> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params = params.set(key, value);
        }
      });
    }
    return this.http
      .get<ApiResponse<TimelineEvent[]>>(`${this.baseUrl}/${timelineId}/events`, { params })
      .pipe(map((r) => r.data));
  }

  createEvent(timelineId: string, payload: Partial<TimelineEvent>) {
    return this.http
      .post<ApiResponse<TimelineEvent>>(`${this.baseUrl}/${timelineId}/events`, payload)
      .pipe(map((r) => r.data));
  }

  updateEvent(timelineId: string, eventId: string, payload: Partial<TimelineEvent>) {
    return this.http
      .patch<ApiResponse<TimelineEvent>>(`${this.baseUrl}/${timelineId}/events/${eventId}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteEvent(timelineId: string, eventId: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${timelineId}/events/${eventId}`)
      .pipe(map((r) => r.data));
  }

  reorderEvents(timelineId: string, events: Array<{ id: string; sortOrder: number }>) {
    return this.http
      .patch<
        ApiResponse<{ message: string }>
      >(`${this.baseUrl}/${timelineId}/events/reorder`, { events })
      .pipe(map((r) => r.data));
  }

  /* ─── Export ─── */

  exportTimeline(timelineId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${timelineId}/export`, {
      responseType: 'blob',
    });
  }
}
