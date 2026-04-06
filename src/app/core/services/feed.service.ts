import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { PostModel, PostType } from '../models/post.model';

type FeedQuery = {
  cursor?: string | null;
  limit?: number;
  type?: PostType | 'ALL' | null;
};

type FeedSearchQuery = FeedQuery & {
  search?: string | null;
  tags?: string[];
};

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly http = inject(HttpClient);

  getFeed(query: FeedQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/feed`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getExploreFeed(query: FeedQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/feed/explore`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchFeed(query: FeedSearchQuery): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/feed/search`, {
        params: this.buildSearchParams(query),
      })
      .pipe(map((response) => response.data));
  }

  searchExplore(query: FeedSearchQuery): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/feed/explore/search`, {
        params: this.buildSearchParams(query),
      })
      .pipe(map((response) => response.data));
  }

  private buildSearchParams(query: FeedSearchQuery) {
    let params = this.buildParams(query);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.tags?.length) {
      for (const tag of query.tags) {
        params = params.append('tags', tag);
      }
    }

    return params;
  }

  private buildParams(query: FeedQuery) {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }

    if (query.limit) {
      params = params.set('limit', query.limit);
    }

    if (query.type && query.type !== 'ALL') {
      params = params.set('type', query.type);
    }

    return params;
  }
}
