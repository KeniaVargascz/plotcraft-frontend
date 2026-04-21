import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpApiService } from '../../../core/services/http-api.service';
import { PagedResponse } from '../../../core/models/feed-pagination.model';
import {
  CreateSeriesPayload,
  SeriesDetail,
  SeriesStatus,
  SeriesSummary,
  SeriesType,
  UpdateSeriesPayload,
} from '../models/series.model';

export interface RemoveNovelResult {
  deleted: boolean;
  series: SeriesDetail | null;
  message?: string;
}

export interface SeriesQuery {
  cursor?: string | null;
  page?: number;
  limit?: number;
  authorUsername?: string;
  type?: SeriesType | null;
  status?: SeriesStatus | null;
  search?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private readonly api = inject(HttpApiService);

  list(query: SeriesQuery = {}): Observable<PagedResponse<SeriesSummary>> {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.authorUsername) params = params.set('authorUsername', query.authorUsername);
    if (query.type) params = params.set('type', query.type);
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);

    return this.api.get<PagedResponse<SeriesSummary>>('/series', { params });
  }

  getBySlug(slug: string): Observable<SeriesDetail> {
    return this.api.get<SeriesDetail>(`/series/${slug}`);
  }

  create(payload: CreateSeriesPayload): Observable<SeriesDetail> {
    return this.api.post<SeriesDetail>('/series', payload);
  }

  update(slug: string, payload: UpdateSeriesPayload): Observable<SeriesDetail> {
    return this.api.patch<SeriesDetail>(`/series/${slug}`, payload);
  }

  delete(slug: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/series/${slug}`);
  }

  addNovel(slug: string, novelId: string, orderIndex: number): Observable<SeriesDetail> {
    return this.api.post<SeriesDetail>(`/series/${slug}/novels`, { novelId, orderIndex });
  }

  removeNovel(slug: string, novelId: string): Observable<RemoveNovelResult> {
    return this.api
      .delete<RemoveNovelResult | SeriesDetail>(`/series/${slug}/novels/${novelId}`)
      .pipe(
        map((data) => {
          if (data && 'deleted' in data && data.deleted === true) {
            return { deleted: true, series: null, message: (data as RemoveNovelResult).message };
          }
          return { deleted: false, series: data as SeriesDetail };
        }),
      );
  }

  listByAuthor(
    username: string,
    query: SeriesQuery = {},
  ): Observable<PagedResponse<SeriesSummary>> {
    return this.list({ ...query, authorUsername: username });
  }

  updateParent(slug: string, parentId: string | null): Observable<SeriesDetail> {
    return this.api.patch<SeriesDetail>(`/series/${slug}`, { parentId });
  }

  reorderNovels(
    slug: string,
    novels: { novelId: string; orderIndex: number }[],
  ): Observable<SeriesDetail> {
    return this.api.patch<SeriesDetail>(`/series/${slug}/novels/reorder`, { novels });
  }

  updateStatus(slug: string, status: SeriesStatus): Observable<SeriesDetail> {
    return this.api.patch<SeriesDetail>(`/series/${slug}/status`, { status });
  }
}
