import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthorAnalytics, AudienceStats } from '../models/author-analytics.model';
import { NovelAnalytics } from '../models/novel-analytics.model';
import { AuthorSnapshot, NovelSnapshot, SnapshotTimeline } from '../models/snapshot.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/analytics`;

  getAuthorAnalytics(period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.http
      .get<ApiResponse<AuthorAnalytics>>(`${this.base}/me`, { params })
      .pipe(map((r) => r.data));
  }

  getAuthorTimeline(period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.http
      .get<ApiResponse<SnapshotTimeline<AuthorSnapshot>>>(`${this.base}/me/timeline`, { params })
      .pipe(map((r) => r.data));
  }

  getAudience() {
    return this.http
      .get<ApiResponse<AudienceStats>>(`${this.base}/me/audience`)
      .pipe(map((r) => r.data));
  }

  getNovelAnalytics(slug: string, period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.http
      .get<ApiResponse<NovelAnalytics>>(`${this.base}/novels/${slug}`, { params })
      .pipe(map((r) => r.data));
  }

  getNovelTimeline(slug: string, period?: string) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.http
      .get<ApiResponse<SnapshotTimeline<NovelSnapshot>>>(`${this.base}/novels/${slug}/timeline`, {
        params,
      })
      .pipe(map((r) => r.data));
  }
}
