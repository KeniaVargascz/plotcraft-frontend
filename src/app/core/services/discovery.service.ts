import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DiscoverySnapshot, TrendingResponse } from '../models/discovery.model';
import { CharacterSummary } from '../models/character.model';
import { NovelSummary } from '../models/novel.model';
import { UserSearchResult, PostSearchResult } from '../models/search.model';
import { WorldSummary } from '../models/world.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly api = inject(HttpApiService);

  getSnapshot(refresh = false): Observable<DiscoverySnapshot> {
    return this.api.get<DiscoverySnapshot>('/discovery', {
      params: refresh ? new HttpParams().set('refresh', '1') : undefined,
    });
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
    return this.api.get<{
      novels: NovelSummary[];
      worlds: WorldSummary[];
      authors: UserSearchResult[];
      posts: PostSearchResult[];
    }>('/discovery/featured', {
      params: refresh ? new HttpParams().set('refresh', '1') : undefined,
    });
  }

  private trending<T>(type: 'novels' | 'worlds' | 'characters' | 'authors', refresh: boolean) {
    return this.api.get<TrendingResponse<T>>(`/discovery/trending/${type}`, {
      params: refresh ? new HttpParams().set('refresh', '1') : undefined,
    });
  }
}
