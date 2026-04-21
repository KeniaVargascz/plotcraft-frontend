import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  TimelineDetail,
  TimelineEvent,
  TimelineEventRelevance,
  TimelineEventType,
  TimelineSummary,
} from '../models/timeline.model';
import { HttpApiService } from './http-api.service';

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
  private readonly api = inject(HttpApiService);

  /* ─── Timelines ─── */

  listMine(): Observable<TimelineSummary[]> {
    return this.api.get<TimelineSummary[]>('/timelines');
  }

  create(payload: { name: string; description?: string; novelId?: string }) {
    return this.api.post<TimelineDetail>('/timelines', payload);
  }

  getById(id: string): Observable<TimelineDetail> {
    return this.api.get<TimelineDetail>(`/timelines/${id}`);
  }

  update(id: string, payload: Partial<{ name: string; description: string | null }>) {
    return this.api.patch<TimelineDetail>(`/timelines/${id}`, payload);
  }

  remove(id: string, confirm?: boolean) {
    const { http, baseUrl } = this.api.raw();
    return http
      .delete<{ data: { message: string } }>(`${baseUrl}/timelines/${id}`, {
        body: { confirm },
      })
      .pipe(map((r) => r.data));
  }

  getByNovelSlug(slug: string) {
    return this.api.get<TimelineDetail>(`/novels/${slug}/timeline`);
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
    return this.api.get<TimelineEvent[]>(`/timelines/${timelineId}/events`, { params });
  }

  createEvent(timelineId: string, payload: Partial<TimelineEvent>) {
    return this.api.post<TimelineEvent>(`/timelines/${timelineId}/events`, payload);
  }

  updateEvent(timelineId: string, eventId: string, payload: Partial<TimelineEvent>) {
    return this.api.patch<TimelineEvent>(
      `/timelines/${timelineId}/events/${eventId}`,
      payload,
    );
  }

  deleteEvent(timelineId: string, eventId: string) {
    return this.api.delete<{ message: string }>(`/timelines/${timelineId}/events/${eventId}`);
  }

  reorderEvents(timelineId: string, events: Array<{ id: string; sortOrder: number }>) {
    return this.api.patch<{ message: string }>(
      `/timelines/${timelineId}/events/reorder`,
      { events },
    );
  }

  /* ─── Export ─── */

  exportTimeline(timelineId: string): Observable<Blob> {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/timelines/${timelineId}/export`, {
      responseType: 'blob',
    });
  }
}
