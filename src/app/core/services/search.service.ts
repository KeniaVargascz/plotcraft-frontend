import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  MixedSearchResponse,
  SearchCharactersResponse,
  SearchHistoryResponse,
  SearchPostsResponse,
  SearchResponse,
  SearchSuggestionsResponse,
  SearchUsersResponse,
  SearchWorldsResponse,
  SearchNovelsResponse,
} from '../models/search.model';

type BaseQuery = {
  q: string;
  cursor?: string | null;
  limit?: number | null;
};

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);

  searchAll(query: BaseQuery): Observable<SearchResponse> {
    return this.http
      .get<ApiResponse<SearchResponse>>(`${environment.apiUrl}/search`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchMixed(query: BaseQuery & { types?: string[] }): Observable<MixedSearchResponse> {
    let params = this.buildParams({ q: query.q, cursor: query.cursor, limit: query.limit });
    const types = query.types ?? ['posts', 'threads', 'communities'];
    for (const t of types) {
      params = params.append('types[]', t);
    }
    return this.http
      .get<ApiResponse<MixedSearchResponse>>(`${environment.apiUrl}/search/unified`, { params })
      .pipe(map((response) => response.data));
  }

  searchNovels(
    query: BaseQuery & {
      genre?: string | null;
      rating?: string | null;
      status?: string | null;
      sort?: string | null;
    },
  ): Observable<SearchNovelsResponse> {
    return this.http
      .get<ApiResponse<SearchNovelsResponse>>(`${environment.apiUrl}/search/novels`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchWorlds(
    query: BaseQuery & {
      sort?: string | null;
    },
  ): Observable<SearchWorldsResponse> {
    return this.http
      .get<ApiResponse<SearchWorldsResponse>>(`${environment.apiUrl}/search/worlds`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchCharacters(
    query: BaseQuery & {
      role?: string | null;
      status?: string | null;
      world_id?: string | null;
    },
  ): Observable<SearchCharactersResponse> {
    return this.http
      .get<ApiResponse<SearchCharactersResponse>>(`${environment.apiUrl}/search/characters`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchUsers(
    query: BaseQuery & {
      sort?: string | null;
    },
  ): Observable<SearchUsersResponse> {
    return this.http
      .get<ApiResponse<SearchUsersResponse>>(`${environment.apiUrl}/search/users`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchPosts(
    query: BaseQuery & {
      type?: string | null;
      sort?: string | null;
    },
  ): Observable<SearchPostsResponse> {
    return this.http
      .get<ApiResponse<SearchPostsResponse>>(`${environment.apiUrl}/search/posts`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getSuggestions(q: string): Observable<SearchSuggestionsResponse> {
    return this.http
      .get<ApiResponse<SearchSuggestionsResponse>>(`${environment.apiUrl}/search/suggestions`, {
        params: new HttpParams().set('q', q),
      })
      .pipe(map((response) => response.data));
  }

  getHistory(): Observable<SearchHistoryResponse> {
    return this.http
      .get<ApiResponse<SearchHistoryResponse>>(`${environment.apiUrl}/search/history`)
      .pipe(map((response) => response.data));
  }

  clearHistory(): Observable<{ cleared: boolean }> {
    return this.http
      .delete<ApiResponse<{ cleared: boolean }>>(`${environment.apiUrl}/search/history`)
      .pipe(map((response) => response.data));
  }

  deleteHistoryItem(id: string): Observable<{ deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${environment.apiUrl}/search/history/${id}`)
      .pipe(map((response) => response.data));
  }

  private buildParams(query: Record<string, string | number | null | undefined>) {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }

    return params;
  }
}
