import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { PostModel, PostType } from '../models/post.model';

type PostQuery = {
  cursor?: string | null;
  limit?: number;
  type?: PostType | 'ALL' | null;
  author?: string | null;
  search?: string | null;
};

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);

  create(payload: { content: string; type: PostType; image_urls?: string[]; tags?: string[] }): Observable<PostModel> {
    return this.http
      .post<ApiResponse<PostModel>>(`${environment.apiUrl}/posts`, payload)
      .pipe(map((response) => response.data));
  }

  update(postId: string, payload: { content: string }): Observable<PostModel> {
    return this.http
      .patch<ApiResponse<PostModel>>(`${environment.apiUrl}/posts/${postId}`, payload)
      .pipe(map((response) => response.data));
  }

  delete(postId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${environment.apiUrl}/posts/${postId}`)
      .pipe(map((response) => response.data));
  }

  getUserPosts(username: string, query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<
        ApiResponse<PaginatedResponse<PostModel>>
      >(`${environment.apiUrl}/posts/user/${username}`, { params: this.buildParams(query) })
      .pipe(map((response) => response.data));
  }

  getSavedPosts(query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/posts/saved`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  list(query: PostQuery = {}): Observable<PaginatedResponse<PostModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PostModel>>>(`${environment.apiUrl}/posts`, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  save(postId: string): Observable<{ saved: boolean }> {
    return this.http
      .post<ApiResponse<{ saved: boolean }>>(`${environment.apiUrl}/posts/${postId}/save`, {})
      .pipe(map((response) => response.data));
  }

  unsave(postId: string): Observable<{ saved: boolean }> {
    return this.http
      .delete<ApiResponse<{ saved: boolean }>>(`${environment.apiUrl}/posts/${postId}/save`)
      .pipe(map((response) => response.data));
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
