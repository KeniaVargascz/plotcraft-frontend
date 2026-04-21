import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpApiService } from '../../../core/services/http-api.service';
import {
  CommunityCharacter,
  CommunityCharacterStatus,
  CreateCommunityCharacterPayload,
  ReviewCommunityCharacterPayload,
  SuggestCommunityCharacterPayload,
  UpdateCommunityCharacterPayload,
} from '../models/community-character.model';

export interface CommunityCharactersQuery {
  status?: CommunityCharacterStatus;
}

@Injectable({ providedIn: 'root' })
export class CommunityCharactersService {
  private readonly api = inject(HttpApiService);

  list(slug: string, query: CommunityCharactersQuery = {}): Observable<CommunityCharacter[]> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    return this.api
      .get<{ items: CommunityCharacter[] }>(`/communities/${slug}/characters`, {
        params,
      })
      .pipe(map((r) => r.items ?? []));
  }

  get(slug: string, charId: string): Observable<CommunityCharacter> {
    return this.api.get<CommunityCharacter>(`/communities/${slug}/characters/${charId}`);
  }

  create(slug: string, payload: CreateCommunityCharacterPayload): Observable<CommunityCharacter> {
    return this.api.post<CommunityCharacter>(`/communities/${slug}/characters`, payload);
  }

  suggest(slug: string, payload: SuggestCommunityCharacterPayload): Observable<CommunityCharacter> {
    return this.api.post<CommunityCharacter>(`/communities/${slug}/characters/suggest`, payload);
  }

  listSuggestions(slug: string): Observable<CommunityCharacter[]> {
    return this.api.get<CommunityCharacter[]>(`/communities/${slug}/characters/suggestions`);
  }

  update(
    slug: string,
    charId: string,
    payload: UpdateCommunityCharacterPayload,
  ): Observable<CommunityCharacter> {
    return this.api.patch<CommunityCharacter>(
      `/communities/${slug}/characters/${charId}`,
      payload,
    );
  }

  delete(slug: string, charId: string): Observable<void> {
    return this.api.delete<void>(`/communities/${slug}/characters/${charId}`);
  }

  approve(
    slug: string,
    charId: string,
    payload: ReviewCommunityCharacterPayload = {},
  ): Observable<CommunityCharacter> {
    return this.api.post<CommunityCharacter>(
      `/communities/${slug}/characters/${charId}/approve`,
      payload,
    );
  }

  reject(slug: string, charId: string, note: string): Observable<CommunityCharacter> {
    return this.api.post<CommunityCharacter>(
      `/communities/${slug}/characters/${charId}/reject`,
      { note },
    );
  }
}
