import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResponse } from '../models/feed-pagination.model';
import {
  NovelDetail,
  NovelRating,
  NovelStatus,
  NovelSummary,
  NovelType,
} from '../models/novel.model';
import { HttpApiService } from './http-api.service';

export type NovelQuery = {
  cursor?: string | null;
  page?: number;
  limit?: number;
  genre?: string | null;
  genres?: string[] | null;
  search?: string | null;
  status?: NovelStatus | null;
  rating?: NovelRating | null;
  sort?: 'recent' | 'popular' | 'views' | null;
  languageId?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  tags?: string[];
  sortBy?: string | null;
  romanceGenreIds?: string[] | null;
  warningIds?: string[] | null;
  pairings?: string[] | null;
  novelType?: NovelType | null;
  fandomSlug?: string | null;
};

export type NovelPayload = {
  title: string;
  synopsis?: string | null;
  coverUrl?: string | null;
  status?: NovelStatus | null;
  rating?: NovelRating | null;
  tags?: string[];
  warnings?: string[];
  warning_ids?: string[];
  genreIds?: string[];
  isPublic?: boolean;
  languageId?: string;
  romanceGenreIds?: string[] | null;
  pairings?: { characterAId: string; characterBId: string; isMain?: boolean }[];
  novelType?: NovelType;
  isAlternateUniverse?: boolean;
  linkedCommunityId?: string | null;
};

@Injectable({ providedIn: 'root' })
export class NovelsService {
  private readonly api = inject(HttpApiService);

  listPublic(query: NovelQuery = {}): Observable<PagedResponse<NovelSummary>> {
    return this.api.get<PagedResponse<NovelSummary>>('/novels', {
      params: this.buildParams(query),
    });
  }

  listMine(query: NovelQuery = {}): Observable<PagedResponse<NovelSummary>> {
    return this.api.get<PagedResponse<NovelSummary>>('/novels/me', {
      params: this.buildParams(query),
    });
  }

  listByUser(username: string, query: NovelQuery = {}): Observable<PagedResponse<NovelSummary>> {
    return this.api.get<PagedResponse<NovelSummary>>(
      `/novels/user/${username}`,
      {
        params: this.buildParams(query),
      },
    );
  }

  getBySlug(slug: string): Observable<NovelDetail> {
    return this.api.get<NovelDetail>(`/novels/${slug}`);
  }

  create(payload: NovelPayload): Observable<NovelSummary> {
    return this.api.post<NovelSummary>('/novels', payload);
  }

  update(slug: string, payload: NovelPayload): Observable<NovelSummary> {
    return this.api.patch<NovelSummary>(`/novels/${slug}`, payload);
  }

  delete(slug: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/novels/${slug}`);
  }

  toggleLike(slug: string): Observable<{ hasLiked: boolean }> {
    return this.api.post<{ hasLiked: boolean }>(`/novels/${slug}/like`, {});
  }

  linkCommunityCharacter(slug: string, communityCharacterId: string): Observable<unknown> {
    return this.api.post<unknown>(`/novels/${slug}/characters`, { communityCharacterId });
  }

  unlinkCommunityCharacter(slug: string, communityCharacterId: string): Observable<unknown> {
    return this.api.delete<unknown>(`/novels/${slug}/characters/${communityCharacterId}`);
  }

  toggleBookmark(slug: string): Observable<{ hasBookmarked: boolean }> {
    return this.api.post<{ hasBookmarked: boolean }>(`/novels/${slug}/bookmark`, {});
  }

  private buildParams(query: NovelQuery) {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit) {
      params = params.set('limit', query.limit);
    }
    if (query.genre) {
      params = params.set('genre', query.genre);
    }
    if (query.genres?.length) {
      for (const g of query.genres) {
        params = params.append('genres', g);
      }
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.rating) {
      params = params.set('rating', query.rating);
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if (query.languageId) {
      params = params.set('languageId', query.languageId);
    }
    if (query.updatedAfter) {
      params = params.set('updatedAfter', query.updatedAfter);
    }
    if (query.updatedBefore) {
      params = params.set('updatedBefore', query.updatedBefore);
    }
    if (query.tags?.length) {
      for (const tag of query.tags) {
        params = params.append('tags', tag);
      }
    }
    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query.romanceGenreIds?.length) {
      for (const g of query.romanceGenreIds) {
        params = params.append('romanceGenreIds', g);
      }
    }
    if (query.warningIds?.length) {
      for (const w of query.warningIds) {
        params = params.append('warningIds', w);
      }
    }
    if (query.pairings?.length) {
      for (const p of query.pairings) {
        params = params.append('pairings', p);
      }
    }
    if (query.novelType) {
      params = params.set('novelType', query.novelType);
    }
    if (query.fandomSlug) {
      params = params.set('fandomSlug', query.fandomSlug);
    }
    if (query.page) params = params.set('page', query.page);

    return params;
  }

  // ── Novel Comments ──

  listComments(slug: string, cursor?: string | null, limit = 20) {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.api.get<{
      commentsEnabled: boolean;
      data: NovelCommentModel[];
      pagination: { nextCursor: string | null; hasMore: boolean; limit: number };
    }>(`/novels/${slug}/comments`, { params });
  }

  createComment(slug: string, content: string) {
    return this.api.post<NovelCommentModel>(`/novels/${slug}/comments`, { content });
  }

  deleteComment(slug: string, commentId: string) {
    return this.api.delete<{ message: string }>(`/novels/${slug}/comments/${commentId}`);
  }
}

export interface NovelCommentModel {
  id: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}
