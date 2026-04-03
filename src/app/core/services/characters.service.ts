import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CharacterDetail,
  CharacterRelationship,
  CharacterRole,
  CharacterStatus,
  CharacterSummary,
} from '../models/character.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

export type CharacterQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  role?: CharacterRole | null;
  status?: CharacterStatus | null;
  worldSlug?: string | null;
  sort?: 'recent' | 'updated' | 'name' | null;
};

export type CharacterPayload = {
  name: string;
  alias?: string[];
  worldId?: string | null;
  role?: CharacterRole | null;
  status?: CharacterStatus | null;
  age?: string | null;
  appearance?: string | null;
  personality?: string | null;
  motivations?: string | null;
  fears?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  backstory?: string | null;
  arc?: string | null;
  avatarUrl?: string | null;
  isPublic?: boolean;
  tags?: string[];
};

@Injectable({ providedIn: 'root' })
export class CharactersService {
  private readonly http = inject(HttpClient);

  listPublic(query: CharacterQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<CharacterSummary>>>(`${environment.apiUrl}/characters`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  listMine(query: CharacterQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<CharacterSummary>>>(
        `${environment.apiUrl}/characters/me`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  listByUser(username: string, query: CharacterQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<CharacterSummary>>>(
        `${environment.apiUrl}/characters/user/${username}`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  listByWorld(worldSlug: string, query: CharacterQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<CharacterSummary>>>(
        `${environment.apiUrl}/characters/world/${worldSlug}`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  getBySlug(username: string, slug: string) {
    return this.http
      .get<ApiResponse<CharacterDetail>>(`${environment.apiUrl}/characters/${username}/${slug}`)
      .pipe(map((response) => response.data));
  }

  listRelationships(username: string, slug: string) {
    return this.http
      .get<
        ApiResponse<CharacterRelationship[]>
      >(`${environment.apiUrl}/characters/${username}/${slug}/relationships`)
      .pipe(map((response) => response.data));
  }

  listNovels(username: string, slug: string) {
    return this.http
      .get<ApiResponse<unknown[]>>(`${environment.apiUrl}/characters/${username}/${slug}/novels`)
      .pipe(map((response) => response.data));
  }

  create(payload: CharacterPayload) {
    return this.http
      .post<ApiResponse<CharacterDetail>>(`${environment.apiUrl}/characters`, payload)
      .pipe(map((response) => response.data));
  }

  update(username: string, slug: string, payload: Partial<CharacterPayload>) {
    return this.http
      .patch<
        ApiResponse<CharacterDetail>
      >(`${environment.apiUrl}/characters/${username}/${slug}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(username: string, slug: string) {
    return this.http
      .delete<
        ApiResponse<{ message: string }>
      >(`${environment.apiUrl}/characters/${username}/${slug}`)
      .pipe(map((response) => response.data));
  }

  createRelationship(
    username: string,
    slug: string,
    payload: { targetId: string; type: string; description?: string | null; isMutual?: boolean },
  ) {
    return this.http
      .post<
        ApiResponse<CharacterRelationship>
      >(`${environment.apiUrl}/characters/${username}/${slug}/relationships`, payload)
      .pipe(map((response) => response.data));
  }

  removeRelationship(username: string, slug: string, relationshipId: string) {
    return this.http
      .delete<
        ApiResponse<{ message: string }>
      >(`${environment.apiUrl}/characters/${username}/${slug}/relationships/${relationshipId}`)
      .pipe(map((response) => response.data));
  }

  linkNovel(username: string, slug: string, novelSlug: string) {
    return this.http
      .post<
        ApiResponse<{ linked: boolean }>
      >(`${environment.apiUrl}/characters/${username}/${slug}/novels/${novelSlug}`, {})
      .pipe(map((response) => response.data));
  }

  unlinkNovel(username: string, slug: string, novelSlug: string) {
    return this.http
      .delete<
        ApiResponse<{ linked: boolean }>
      >(`${environment.apiUrl}/characters/${username}/${slug}/novels/${novelSlug}`)
      .pipe(map((response) => response.data));
  }

  private buildParams(query: CharacterQuery) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    if (query.status) params = params.set('status', query.status);
    if (query.worldSlug) params = params.set('worldSlug', query.worldSlug);
    if (query.sort) params = params.set('sort', query.sort);
    return params;
  }
}
