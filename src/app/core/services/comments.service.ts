import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CommentModel } from '../models/comment.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);

  list(
    postId: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<CommentModel>> {
    let params = new HttpParams().set('limit', limit);

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<
        ApiResponse<PaginatedResponse<CommentModel>>
      >(`${environment.apiUrl}/posts/${postId}/comments`, { params })
      .pipe(map((response) => response.data));
  }

  create(postId: string, payload: { content: string }): Observable<CommentModel> {
    return this.http
      .post<ApiResponse<CommentModel>>(`${environment.apiUrl}/posts/${postId}/comments`, payload)
      .pipe(map((response) => response.data));
  }

  update(
    postId: string,
    commentId: string,
    payload: { content: string },
  ): Observable<CommentModel> {
    return this.http
      .patch<
        ApiResponse<CommentModel>
      >(`${environment.apiUrl}/posts/${postId}/comments/${commentId}`, payload)
      .pipe(map((response) => response.data));
  }

  delete(postId: string, commentId: string): Observable<CommentModel> {
    return this.http
      .delete<
        ApiResponse<CommentModel>
      >(`${environment.apiUrl}/posts/${postId}/comments/${commentId}`)
      .pipe(map((response) => response.data));
  }
}
