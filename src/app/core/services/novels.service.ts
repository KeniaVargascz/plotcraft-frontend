import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { NovelDetail, NovelRating, NovelStatus, NovelSummary } from '../models/novel.model';

export type NovelQuery = {
  cursor?: string | null;
  limit?: number;
  genre?: string | null;
  search?: string | null;
  status?: NovelStatus | null;
  rating?: NovelRating | null;
  sort?: 'recent' | 'popular' | 'views' | null;
};

export type NovelPayload = {
  title: string;
  synopsis?: string | null;
  coverUrl?: string | null;
  status?: NovelStatus | null;
  rating?: NovelRating | null;
  tags?: string[];
  warnings?: string[];
  genreIds?: string[];
  isPublic?: boolean;
};

@Injectable({ providedIn: 'root' })
export class NovelsService {
  private readonly http = inject(HttpClient);

  listPublic(query: NovelQuery = {}): Observable<PaginatedResponse<NovelSummary>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<NovelSummary>>>(`${environment.apiUrl}/novels`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  listMine(query: NovelQuery = {}): Observable<PaginatedResponse<NovelSummary>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<NovelSummary>>>(`${environment.apiUrl}/novels/me`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  listByUser(
    username: string,
    query: NovelQuery = {},
  ): Observable<PaginatedResponse<NovelSummary>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<NovelSummary>>>(
        `${environment.apiUrl}/novels/user/${username}`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  getBySlug(slug: string): Observable<NovelDetail> {
    return this.http
      .get<ApiResponse<NovelDetail>>(`${environment.apiUrl}/novels/${slug}`)
      .pipe(map((response) => response.data));
  }

  create(payload: NovelPayload): Observable<NovelSummary> {
    return this.http
      .post<ApiResponse<NovelSummary>>(`${environment.apiUrl}/novels`, payload)
      .pipe(map((response) => response.data));
  }

  update(slug: string, payload: NovelPayload): Observable<NovelSummary> {
    return this.http
      .patch<ApiResponse<NovelSummary>>(`${environment.apiUrl}/novels/${slug}`, payload)
      .pipe(map((response) => response.data));
  }

  delete(slug: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${environment.apiUrl}/novels/${slug}`)
      .pipe(map((response) => response.data));
  }

  toggleLike(slug: string): Observable<{ hasLiked: boolean }> {
    return this.http
      .post<ApiResponse<{ hasLiked: boolean }>>(`${environment.apiUrl}/novels/${slug}/like`, {})
      .pipe(map((response) => response.data));
  }

  toggleBookmark(slug: string): Observable<{ hasBookmarked: boolean }> {
    return this.http
      .post<
        ApiResponse<{ hasBookmarked: boolean }>
      >(`${environment.apiUrl}/novels/${slug}/bookmark`, {})
      .pipe(map((response) => response.data));
  }

  private buildParams(query: NovelQuery) {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit) {
      params = params.set('limit', query.limit);
    }
    if (query.genre) {
      params = params.set('genre', query.genre);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.rating) {
      params = params.set('rating', query.rating);
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    return params;
  }
}
