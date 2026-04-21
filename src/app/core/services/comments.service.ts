import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentModel } from '../models/comment.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly api = inject(HttpApiService);

  list(
    postId: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<CommentModel>> {
    let params = new HttpParams().set('limit', limit);

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.api.get<PaginatedResponse<CommentModel>>(
      `/posts/${postId}/comments`,
      { params },
    );
  }

  create(postId: string, payload: { content: string }): Observable<CommentModel> {
    return this.api.post<CommentModel>(`/posts/${postId}/comments`, payload);
  }

  update(
    postId: string,
    commentId: string,
    payload: { content: string },
  ): Observable<CommentModel> {
    return this.api.patch<CommentModel>(
      `/posts/${postId}/comments/${commentId}`,
      payload,
    );
  }

  delete(postId: string, commentId: string): Observable<CommentModel> {
    return this.api.delete<CommentModel>(`/posts/${postId}/comments/${commentId}`);
  }
}
