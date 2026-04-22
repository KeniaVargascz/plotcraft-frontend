import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { PostModel, PostType } from '../models/post.model';
import { HttpApiService } from './http-api.service';

type PostQuery = {
  cursor?: string | null;
  limit?: number;
  type?: PostType | 'ALL' | null;
  author?: string | null;
  search?: string | null;
};

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly api = inject(HttpApiService);

  create(payload: {
    content: string;
    type: PostType;
    image_urls?: string[];
    tags?: string[];
    novelId?: string;
    chapterId?: string;
    world_id?: string;
    character_ids?: string[];
  }): Observable<PostModel> {
    return this.api.post<PostModel>('/posts', payload);
  }

  update(postId: string, payload: { content: string }): Observable<PostModel> {
    return this.api.patch<PostModel>(`/posts/${postId}`, payload);
  }

  delete(postId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/posts/${postId}`);
  }

  getUserPosts(username: string, query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>(
      `/posts/user/${username}`,
      { params: this.buildParams(query) },
    );
  }

  getSavedPosts(query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/posts/saved', {
      params: this.buildParams(query),
    });
  }

  list(query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.api.get<PaginatedResponse<PostModel>>('/posts', {
      params: this.buildParams(query),
    });
  }

  save(postId: string): Observable<{ saved: boolean }> {
    return this.api.post<{ saved: boolean }>(`/posts/${postId}/save`, {});
  }

  unsave(postId: string): Observable<{ saved: boolean }> {
    return this.api.delete<{ saved: boolean }>(`/posts/${postId}/save`);
  }

  private buildParams(query: PostQuery) {
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

    if (query.author) {
      params = params.set('author', query.author);
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

    return params;
  }
}
