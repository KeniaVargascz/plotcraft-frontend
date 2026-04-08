import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/communities`;

  list(slug: string, query: CommunityCharactersQuery = {}): Observable<CommunityCharacter[]> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    return this.http
      .get<ApiResponse<{ items: CommunityCharacter[] }>>(`${this.baseUrl}/${slug}/characters`, {
        params,
      })
      .pipe(map((r) => r.data.items ?? []));
  }

  get(slug: string, charId: string): Observable<CommunityCharacter> {
    return this.http
      .get<ApiResponse<CommunityCharacter>>(`${this.baseUrl}/${slug}/characters/${charId}`)
      .pipe(map((r) => r.data));
  }

  create(slug: string, payload: CreateCommunityCharacterPayload): Observable<CommunityCharacter> {
    return this.http
      .post<ApiResponse<CommunityCharacter>>(`${this.baseUrl}/${slug}/characters`, payload)
      .pipe(map((r) => r.data));
  }

  suggest(
    slug: string,
    payload: SuggestCommunityCharacterPayload,
  ): Observable<CommunityCharacter> {
    return this.http
      .post<
        ApiResponse<CommunityCharacter>
      >(`${this.baseUrl}/${slug}/characters/suggest`, payload)
      .pipe(map((r) => r.data));
  }

  listSuggestions(slug: string): Observable<CommunityCharacter[]> {
    return this.http
      .get<ApiResponse<CommunityCharacter[]>>(`${this.baseUrl}/${slug}/characters/suggestions`)
      .pipe(map((r) => r.data));
  }

  update(
    slug: string,
    charId: string,
    payload: UpdateCommunityCharacterPayload,
  ): Observable<CommunityCharacter> {
    return this.http
      .patch<
        ApiResponse<CommunityCharacter>
      >(`${this.baseUrl}/${slug}/characters/${charId}`, payload)
      .pipe(map((r) => r.data));
  }

  delete(slug: string, charId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${slug}/characters/${charId}`)
      .pipe(map((r) => r.data));
  }

  approve(
    slug: string,
    charId: string,
    payload: ReviewCommunityCharacterPayload = {},
  ): Observable<CommunityCharacter> {
    return this.http
      .post<
        ApiResponse<CommunityCharacter>
      >(`${this.baseUrl}/${slug}/characters/${charId}/approve`, payload)
      .pipe(map((r) => r.data));
  }

  reject(slug: string, charId: string, note: string): Observable<CommunityCharacter> {
    return this.http
      .post<
        ApiResponse<CommunityCharacter>
      >(`${this.baseUrl}/${slug}/characters/${charId}/reject`, { note })
      .pipe(map((r) => r.data));
  }
}
