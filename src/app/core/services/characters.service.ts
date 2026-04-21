import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CharacterDetail,
  CharacterKinshipType,
  CharacterRelationship,
  CharacterRelationshipCategory,
  CharacterRole,
  CharacterStatus,
  CharacterSummary,
} from '../models/character.model';
import { PagedResponse, PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

export type CharacterQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  role?: CharacterRole | null;
  status?: CharacterStatus | null;
  worldSlug?: string | null;
  sort?: 'recent' | 'updated' | 'name' | null;
  page?: number;
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
  private readonly api = inject(HttpApiService);

  listPublic(query: CharacterQuery = {}) {
    return this.api.get<PagedResponse<CharacterSummary>>('/characters', {
      params: this.buildParams(query),
    });
  }

  listMine(query: CharacterQuery = {}) {
    return this.api.get<PagedResponse<CharacterSummary>>('/characters/me', {
      params: this.buildParams(query),
    });
  }

  listByUser(username: string, query: CharacterQuery = {}) {
    return this.api.get<PagedResponse<CharacterSummary>>(
      `/characters/user/${username}`,
      {
        params: this.buildParams(query),
      },
    );
  }

  listByWorld(worldSlug: string, query: CharacterQuery = {}) {
    return this.api.get<PagedResponse<CharacterSummary>>(
      `/characters/world/${worldSlug}`,
      {
        params: this.buildParams(query),
      },
    );
  }

  getBySlug(username: string, slug: string) {
    return this.api.get<CharacterDetail>(`/characters/${username}/${slug}`);
  }

  listRelationships(username: string, slug: string, query: CharacterQuery = {}) {
    return this.api.get<PaginatedResponse<CharacterRelationship>>(
      `/characters/${username}/${slug}/relationships`,
      {
        params: this.buildParams(query),
      },
    );
  }

  listNovels(username: string, slug: string, query: CharacterQuery = {}) {
    return this.api.get<PaginatedResponse<unknown>>(
      `/characters/${username}/${slug}/novels`,
      {
        params: this.buildParams(query),
      },
    );
  }

  create(payload: CharacterPayload) {
    return this.api.post<CharacterDetail>('/characters', payload);
  }

  update(username: string, slug: string, payload: Partial<CharacterPayload>) {
    return this.api.patch<CharacterDetail>(`/characters/${username}/${slug}`, payload);
  }

  remove(username: string, slug: string) {
    return this.api.delete<{ message: string }>(`/characters/${username}/${slug}`);
  }

  createRelationship(
    username: string,
    slug: string,
    payload: {
      targetId: string;
      category?: CharacterRelationshipCategory;
      kinshipType?: CharacterKinshipType;
      type?: string;
      description?: string | null;
      isMutual?: boolean;
    },
  ) {
    return this.api.post<CharacterRelationship>(
      `/characters/${username}/${slug}/relationships`,
      payload,
    );
  }

  removeRelationship(username: string, slug: string, relationshipId: string) {
    return this.api.delete<{ message: string }>(
      `/characters/${username}/${slug}/relationships/${relationshipId}`,
    );
  }

  linkNovel(username: string, slug: string, novelSlug: string) {
    return this.api.post<{ linked: boolean }>(
      `/characters/${username}/${slug}/novels/${novelSlug}`,
      {},
    );
  }

  unlinkNovel(username: string, slug: string, novelSlug: string) {
    return this.api.delete<{ linked: boolean }>(
      `/characters/${username}/${slug}/novels/${novelSlug}`,
    );
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
    if (query.page) params = params.set('page', query.page);
    return params;
  }
}
