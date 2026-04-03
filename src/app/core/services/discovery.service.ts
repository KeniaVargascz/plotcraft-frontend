import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DiscoverySnapshot, TrendingResponse } from '../models/discovery.model';
import { CharacterSummary } from '../models/character.model';
import { NovelSummary } from '../models/novel.model';
import { UserSearchResult, PostSearchResult } from '../models/search.model';
import { WorldSummary } from '../models/world.model';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);

  getSnapshot(refresh = false): Observable<DiscoverySnapshot> {
    return this.http
      .get<ApiResponse<DiscoverySnapshot>>(`${environment.apiUrl}/discovery`, {
        params: refresh ? new HttpParams().set('refresh', '1') : undefined,
      })
      .pipe(map((response) => response.data));
  }

  getTrendingNovels(refresh = false): Observable<TrendingResponse<NovelSummary>> {
    return this.trending<NovelSummary>('novels', refresh);
  }

  getTrendingWorlds(refresh = false): Observable<TrendingResponse<WorldSummary>> {
    return this.trending<WorldSummary>('worlds', refresh);
  }

  getTrendingCharacters(refresh = false): Observable<TrendingResponse<CharacterSummary>> {
    return this.trending<CharacterSummary>('characters', refresh);
  }

  getTrendingAuthors(refresh = false): Observable<TrendingResponse<UserSearchResult>> {
    return this.trending<UserSearchResult>('authors', refresh);
  }

  getFeatured(refresh = false): Observable<{
    novels: NovelSummary[];
    worlds: WorldSummary[];
    authors: UserSearchResult[];
    posts: PostSearchResult[];
  }> {
    return this.http
      .get<
        ApiResponse<{
          novels: NovelSummary[];
          worlds: WorldSummary[];
          authors: UserSearchResult[];
          posts: PostSearchResult[];
        }>
      >(`${environment.apiUrl}/discovery/featured`, {
        params: refresh ? new HttpParams().set('refresh', '1') : undefined,
      })
      .pipe(map((response) => response.data));
  }

  private trending<T>(type: 'novels' | 'worlds' | 'characters' | 'authors', refresh: boolean) {
    return this.http
      .get<ApiResponse<TrendingResponse<T>>>(`${environment.apiUrl}/discovery/trending/${type}`, {
        params: refresh ? new HttpParams().set('refresh', '1') : undefined,
      })
      .pipe(map((response) => response.data));
  }
}
