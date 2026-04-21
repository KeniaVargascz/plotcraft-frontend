import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedResponse } from '../models/feed-pagination.model';
import { WorldDetail, WorldGenre, WorldSummary, WorldVisibility } from '../models/world.model';
import { HttpApiService } from './http-api.service';

export type WorldQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  visibility?: WorldVisibility | null;
  sort?: 'recent' | 'updated' | 'name' | null;
  page?: number;
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
  private readonly api = inject(HttpApiService);

  listPublic(query: WorldQuery = {}) {
    return this.api.get<PagedResponse<WorldSummary>>('/worlds', {
      params: this.buildParams(query),
    });
  }

  listMine(query: WorldQuery = {}) {
    return this.api.get<PagedResponse<WorldSummary>>('/worlds/me', {
      params: this.buildParams(query),
    });
  }

  listByUser(username: string, query: WorldQuery = {}) {
    return this.api.get<PagedResponse<WorldSummary>>(
      `/worlds/user/${username}`,
      {
        params: this.buildParams(query),
      },
    );
  }

  getBySlug(slug: string) {
    return this.api.get<WorldDetail>(`/worlds/${slug}`);
  }

  listWorldNovels(slug: string) {
    return this.api.get<unknown[]>(`/worlds/${slug}/novels`);
  }

  create(payload: WorldPayload) {
    return this.api.post<WorldDetail>('/worlds', payload);
  }

  update(slug: string, payload: Partial<WorldPayload>) {
    return this.api.patch<WorldDetail>(`/worlds/${slug}`, payload);
  }

  remove(slug: string) {
    return this.api.delete<{ message: string }>(`/worlds/${slug}`);
  }

  createLocation(
    slug: string,
    payload: { name: string; type: string; description?: string | null; isNotable?: boolean },
  ) {
    return this.api.post<unknown>(`/worlds/${slug}/locations`, payload);
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
    return this.api.patch<unknown>(`/worlds/${slug}/locations/${locationId}`, payload);
  }

  removeLocation(slug: string, locationId: string) {
    return this.api.delete<{ message: string }>(`/worlds/${slug}/locations/${locationId}`);
  }

  linkNovel(slug: string, novelSlug: string) {
    return this.api.post<{ linked: boolean }>(`/worlds/${slug}/novels/${novelSlug}`, {});
  }

  unlinkNovel(slug: string, novelSlug: string) {
    return this.api.delete<{ linked: boolean }>(`/worlds/${slug}/novels/${novelSlug}`);
  }

  private buildParams(query: WorldQuery) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.visibility) params = params.set('visibility', query.visibility);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.page) params = params.set('page', query.page);
    return params;
  }
}
