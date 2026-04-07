import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CommunityForum,
  CreateForumPayload,
  CreateThreadPayload,
  ForumMembershipResult,
  ForumReply,
  ForumThread,
  ThreadSortBy,
  UpdateForumPayload,
} from '../models/community-forum.model';

export interface ThreadListResponse {
  data: ForumThread[];
  pagination: { nextCursor: string | null; hasMore: boolean };
}

export interface ReplyListResponse {
  data: ForumReply[];
  pagination: { nextCursor: string | null; hasMore: boolean };
}

@Injectable({ providedIn: 'root' })
export class CommunityForumsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/communities`;

  listForums(communitySlug: string): Observable<CommunityForum[]> {
    return this.http
      .get<ApiResponse<CommunityForum[]>>(`${this.baseUrl}/${communitySlug}/forums`)
      .pipe(map((r) => r.data));
  }

  getForum(communitySlug: string, forumSlug: string): Observable<CommunityForum> {
    return this.http
      .get<ApiResponse<CommunityForum>>(`${this.baseUrl}/${communitySlug}/forums/${forumSlug}`)
      .pipe(map((r) => r.data));
  }

  createForum(communitySlug: string, payload: CreateForumPayload): Observable<CommunityForum> {
    return this.http
      .post<ApiResponse<CommunityForum>>(`${this.baseUrl}/${communitySlug}/forums`, payload)
      .pipe(map((r) => r.data));
  }

  updateForum(
    communitySlug: string,
    forumSlug: string,
    payload: UpdateForumPayload,
  ): Observable<CommunityForum> {
    return this.http
      .patch<ApiResponse<CommunityForum>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteForum(communitySlug: string, forumSlug: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${communitySlug}/forums/${forumSlug}`)
      .pipe(map(() => undefined));
  }

  joinForum(communitySlug: string, forumSlug: string): Observable<ForumMembershipResult> {
    return this.http
      .post<ApiResponse<ForumMembershipResult>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/join`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  leaveForum(communitySlug: string, forumSlug: string): Observable<ForumMembershipResult> {
    return this.http
      .delete<ApiResponse<ForumMembershipResult>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/leave`,
      )
      .pipe(map((r) => r.data));
  }

  listThreads(
    communitySlug: string,
    forumSlug: string,
    options: { sortBy?: ThreadSortBy; cursor?: string | null } = {},
  ): Observable<ThreadListResponse> {
    let params = new HttpParams();
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.cursor) params = params.set('cursor', options.cursor);
    return this.http
      .get<ApiResponse<ThreadListResponse>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/threads`,
        { params },
      )
      .pipe(map((r) => r.data));
  }

  getThread(
    communitySlug: string,
    forumSlug: string,
    threadSlug: string,
  ): Observable<ForumThread> {
    return this.http
      .get<ApiResponse<ForumThread>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}`,
      )
      .pipe(map((r) => r.data));
  }

  listReplies(
    communitySlug: string,
    forumSlug: string,
    threadSlug: string,
    options: { cursor?: string | null; limit?: number } = {},
  ): Observable<ReplyListResponse> {
    let params = new HttpParams();
    if (options.cursor) params = params.set('cursor', options.cursor);
    if (options.limit) params = params.set('limit', options.limit);
    return this.http
      .get<ApiResponse<ReplyListResponse>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}/replies`,
        { params },
      )
      .pipe(map((r) => r.data));
  }

  createThread(
    communitySlug: string,
    forumSlug: string,
    payload: CreateThreadPayload,
  ): Observable<ForumThread> {
    return this.http
      .post<ApiResponse<ForumThread>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/threads`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  postReply(
    communitySlug: string,
    forumSlug: string,
    threadSlug: string,
    content: string,
  ): Observable<ForumReply> {
    return this.http
      .post<ApiResponse<ForumReply>>(
        `${this.baseUrl}/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}/replies`,
        { content },
      )
      .pipe(map((r) => r.data));
  }
}
