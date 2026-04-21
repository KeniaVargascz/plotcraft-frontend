import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthorAnalytics, AudienceStats } from '../models/author-analytics.model';
import { NovelAnalytics } from '../models/novel-analytics.model';
import { AuthorSnapshot, NovelSnapshot, SnapshotTimeline } from '../models/snapshot.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(HttpApiService);

  getAuthorAnalytics(period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.api.get<AuthorAnalytics>('/analytics/me', { params });
  }

  getAuthorTimeline(period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.api.get<SnapshotTimeline<AuthorSnapshot>>('/analytics/me/timeline', { params });
  }

  getAudience() {
    return this.api.get<AudienceStats>('/analytics/me/audience');
  }

  getNovelAnalytics(slug: string, period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.api.get<NovelAnalytics>(`/analytics/novels/${slug}`, { params });
  }

  getNovelTimeline(slug: string, period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.api.get<SnapshotTimeline<NovelSnapshot>>(`/analytics/novels/${slug}/timeline`, {
      params,
    });
  }
}
