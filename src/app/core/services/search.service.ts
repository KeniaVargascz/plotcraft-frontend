import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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
import { HttpApiService } from './http-api.service';

type BaseQuery = {
  q: string;
  cursor?: string | null;
  limit?: number | null;
  page?: number;
};

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(HttpApiService);

  searchAll(query: BaseQuery): Observable<SearchResponse> {
    return this.api.get<SearchResponse>('/search', {
      params: this.buildParams(query),
    });
  }

  searchMixed(query: BaseQuery & { types?: string[] }): Observable<MixedSearchResponse> {
    let params = this.buildParams({ q: query.q, cursor: query.cursor, limit: query.limit });
    const types = query.types ?? ['posts', 'threads', 'communities'];
    for (const t of types) {
      params = params.append('types[]', t);
    }
    return this.api.get<MixedSearchResponse>('/search/unified', { params });
  }

  searchNovels(
    query: BaseQuery & {
      genre?: string | null;
      rating?: string | null;
      status?: string | null;
      sort?: string | null;
    },
  ): Observable<SearchNovelsResponse> {
    return this.api.get<SearchNovelsResponse>('/search/novels', {
      params: this.buildParams(query),
    });
  }

  searchWorlds(
    query: BaseQuery & {
      sort?: string | null;
    },
  ): Observable<SearchWorldsResponse> {
    return this.api.get<SearchWorldsResponse>('/search/worlds', {
      params: this.buildParams(query),
    });
  }

  searchCharacters(
    query: BaseQuery & {
      role?: string | null;
      status?: string | null;
      world_id?: string | null;
    },
  ): Observable<SearchCharactersResponse> {
    return this.api.get<SearchCharactersResponse>('/search/characters', {
      params: this.buildParams(query),
    });
  }

  searchUsers(
    query: BaseQuery & {
      sort?: string | null;
    },
  ): Observable<SearchUsersResponse> {
    return this.api.get<SearchUsersResponse>('/search/users', {
      params: this.buildParams(query),
    });
  }

  searchPosts(
    query: BaseQuery & {
      type?: string | null;
      sort?: string | null;
    },
  ): Observable<SearchPostsResponse> {
    return this.api.get<SearchPostsResponse>('/search/posts', {
      params: this.buildParams(query),
    });
  }

  getSuggestions(q: string): Observable<SearchSuggestionsResponse> {
    return this.api.get<SearchSuggestionsResponse>('/search/suggestions', {
      params: new HttpParams().set('q', q),
    });
  }

  getHistory(): Observable<SearchHistoryResponse> {
    return this.api.get<SearchHistoryResponse>('/search/history');
  }

  clearHistory(): Observable<{ cleared: boolean }> {
    return this.api.delete<{ cleared: boolean }>('/search/history');
  }

  deleteHistoryItem(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/search/history/${id}`);
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
