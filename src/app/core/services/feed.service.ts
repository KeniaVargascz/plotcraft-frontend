import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { PostModel, PostType } from '../models/post.model';
import { HttpApiService } from './http-api.service';

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
  private readonly api = inject(HttpApiService);

  getFeed(query: FeedQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/feed', {
      params: this.buildParams(query),
    });
  }

  getExploreFeed(query: FeedQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/feed/explore', {
      params: this.buildParams(query),
    });
  }

  searchFeed(query: FeedSearchQuery): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/feed/search', {
      params: this.buildSearchParams(query),
    });
  }

  searchExplore(query: FeedSearchQuery): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/feed/explore/search', {
      params: this.buildSearchParams(query),
    });
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
