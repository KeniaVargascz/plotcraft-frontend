import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { WorldDetail, WorldGenre, WorldSummary, WorldVisibility } from '../models/world.model';

export type WorldQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  visibility?: WorldVisibility | null;
  sort?: 'recent' | 'updated' | 'name' | null;
};

export type WorldPayload = {
  name: string;
  tagline?: string | null;
  description?: string | null;
  setting?: string | null;
  magicSystem?: string | null;
  rules?: string | null;
  coverUrl?: string | null;
  mapUrl?: string | null;
  genre?: WorldGenre | null;
  visibility?: WorldVisibility | null;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
};

@Injectable({ providedIn: 'root' })
export class WorldsService {
  private readonly http = inject(HttpClient);

  listPublic(query: WorldQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WorldSummary>>>(`${environment.apiUrl}/worlds`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  listMine(query: WorldQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WorldSummary>>>(`${environment.apiUrl}/worlds/me`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  listByUser(username: string, query: WorldQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WorldSummary>>>(
        `${environment.apiUrl}/worlds/user/${username}`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  getBySlug(slug: string) {
    return this.http
      .get<ApiResponse<WorldDetail>>(`${environment.apiUrl}/worlds/${slug}`)
      .pipe(map((response) => response.data));
  }

  listWorldNovels(slug: string) {
    return this.http
      .get<ApiResponse<unknown[]>>(`${environment.apiUrl}/worlds/${slug}/novels`)
      .pipe(map((response) => response.data));
  }

  create(payload: WorldPayload) {
    return this.http
      .post<ApiResponse<WorldDetail>>(`${environment.apiUrl}/worlds`, payload)
      .pipe(map((response) => response.data));
  }

  update(slug: string, payload: Partial<WorldPayload>) {
    return this.http
      .patch<ApiResponse<WorldDetail>>(`${environment.apiUrl}/worlds/${slug}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(slug: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${environment.apiUrl}/worlds/${slug}`)
      .pipe(map((response) => response.data));
  }

  createLocation(
    slug: string,
    payload: { name: string; type: string; description?: string | null; isNotable?: boolean },
  ) {
    return this.http
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/worlds/${slug}/locations`, payload)
      .pipe(map((response) => response.data));
  }

  updateLocation(
    slug: string,
    locationId: string,
    payload: Partial<{
      name: string;
      type: string;
      description?: string | null;
      isNotable: boolean;
    }>,
  ) {
    return this.http
      .patch<
        ApiResponse<unknown>
      >(`${environment.apiUrl}/worlds/${slug}/locations/${locationId}`, payload)
      .pipe(map((response) => response.data));
  }

  removeLocation(slug: string, locationId: string) {
    return this.http
      .delete<
        ApiResponse<{ message: string }>
      >(`${environment.apiUrl}/worlds/${slug}/locations/${locationId}`)
      .pipe(map((response) => response.data));
  }

  linkNovel(slug: string, novelSlug: string) {
    return this.http
      .post<
        ApiResponse<{ linked: boolean }>
      >(`${environment.apiUrl}/worlds/${slug}/novels/${novelSlug}`, {})
      .pipe(map((response) => response.data));
  }

  unlinkNovel(slug: string, novelSlug: string) {
    return this.http
      .delete<
        ApiResponse<{ linked: boolean }>
      >(`${environment.apiUrl}/worlds/${slug}/novels/${novelSlug}`)
      .pipe(map((response) => response.data));
  }

  private buildParams(query: WorldQuery) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.visibility) params = params.set('visibility', query.visibility);
    if (query.sort) params = params.set('sort', query.sort);
    return params;
  }
}
