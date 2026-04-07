import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PaginatedResponse } from '../../../core/models/feed-pagination.model';
import {
  CreateSeriesPayload,
  SeriesDetail,
  SeriesStatus,
  SeriesSummary,
  SeriesType,
  UpdateSeriesPayload,
} from '../models/series.model';

export interface SeriesQuery {
  cursor?: string | null;
  limit?: number;
  authorUsername?: string;
  type?: SeriesType | null;
  status?: SeriesStatus | null;
  search?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/series`;

  list(query: SeriesQuery = {}): Observable<PaginatedResponse<SeriesSummary>> {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.authorUsername) params = params.set('authorUsername', query.authorUsername);
    if (query.type) params = params.set('type', query.type);
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);

    return this.http
      .get<ApiResponse<PaginatedResponse<SeriesSummary>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getBySlug(slug: string): Observable<SeriesDetail> {
    return this.http
      .get<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}`)
      .pipe(map((r) => r.data));
  }

  create(payload: CreateSeriesPayload): Observable<SeriesDetail> {
    return this.http
      .post<ApiResponse<SeriesDetail>>(this.baseUrl, payload)
      .pipe(map((r) => r.data));
  }

  update(slug: string, payload: UpdateSeriesPayload): Observable<SeriesDetail> {
    return this.http
      .patch<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}`, payload)
      .pipe(map((r) => r.data));
  }

  delete(slug: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${slug}`)
      .pipe(map((r) => r.data));
  }

  addNovel(slug: string, novelId: string, orderIndex: number): Observable<SeriesDetail> {
    return this.http
      .post<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}/novels`, { novelId, orderIndex })
      .pipe(map((r) => r.data));
  }

  removeNovel(slug: string, novelId: string): Observable<SeriesDetail> {
    return this.http
      .delete<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}/novels/${novelId}`)
      .pipe(map((r) => r.data));
  }

  reorderNovels(
    slug: string,
    novels: { novelId: string; orderIndex: number }[],
  ): Observable<SeriesDetail> {
    return this.http
      .patch<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}/novels/reorder`, { novels })
      .pipe(map((r) => r.data));
  }

  updateStatus(slug: string, status: SeriesStatus): Observable<SeriesDetail> {
    return this.http
      .patch<ApiResponse<SeriesDetail>>(`${this.baseUrl}/${slug}/status`, { status })
      .pipe(map((r) => r.data));
  }
}
