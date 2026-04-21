import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpApiService } from '../../../core/services/http-api.service';
import {
  CommunityForum,
  CreateForumPayload,
  CreateThreadPayload,
  DiscussedThread,
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
  private readonly api = inject(HttpApiService);

  listForums(communitySlug: string): Observable<CommunityForum[]> {
    return this.api.get<CommunityForum[]>(`/communities/${communitySlug}/forums`);
  }

  getForum(communitySlug: string, forumSlug: string): Observable<CommunityForum> {
    return this.api.get<CommunityForum>(
      `/communities/${communitySlug}/forums/${forumSlug}`,
    );
  }

  createForum(communitySlug: string, payload: CreateForumPayload): Observable<CommunityForum> {
    return this.api.post<CommunityForum>(
      `/communities/${communitySlug}/forums`,
      payload,
    );
  }

  updateForum(
    communitySlug: string,
    forumSlug: string,
    payload: UpdateForumPayload,
  ): Observable<CommunityForum> {
    return this.api.patch<CommunityForum>(
      `/communities/${communitySlug}/forums/${forumSlug}`,
      payload,
    );
  }

  deleteForum(communitySlug: string, forumSlug: string): Observable<void> {
    return this.api.delete<void>(
      `/communities/${communitySlug}/forums/${forumSlug}`,
    );
  }

  joinForum(communitySlug: string, forumSlug: string): Observable<ForumMembershipResult> {
    return this.api.post<ForumMembershipResult>(
      `/communities/${communitySlug}/forums/${forumSlug}/join`,
      {},
    );
  }

  leaveForum(communitySlug: string, forumSlug: string): Observable<ForumMembershipResult> {
    return this.api.delete<ForumMembershipResult>(
      `/communities/${communitySlug}/forums/${forumSlug}/leave`,
    );
  }

  listThreads(
    communitySlug: string,
    forumSlug: string,
    options: { sortBy?: ThreadSortBy; cursor?: string | null } = {},
  ): Observable<ThreadListResponse> {
    let params = new HttpParams();
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.cursor) params = params.set('cursor', options.cursor);
    return this.api.get<ThreadListResponse>(
      `/communities/${communitySlug}/forums/${forumSlug}/threads`,
      { params },
    );
  }

  getThread(communitySlug: string, forumSlug: string, threadSlug: string): Observable<ForumThread> {
    return this.api.get<ForumThread>(
      `/communities/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}`,
    );
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
    return this.api.get<ReplyListResponse>(
      `/communities/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}/replies`,
      { params },
    );
  }

  listDiscussedThreads(communitySlug: string, limit = 5): Observable<DiscussedThread[]> {
    return this.api.get<DiscussedThread[]>(
      `/communities/${communitySlug}/discussed-threads`,
      { params: { limit } },
    );
  }

  createThread(
    communitySlug: string,
    forumSlug: string,
    payload: CreateThreadPayload,
  ): Observable<ForumThread> {
    return this.api.post<ForumThread>(
      `/communities/${communitySlug}/forums/${forumSlug}/threads`,
      payload,
    );
  }

  postReply(
    communitySlug: string,
    forumSlug: string,
    threadSlug: string,
    content: string,
  ): Observable<ForumReply> {
    return this.api.post<ForumReply>(
      `/communities/${communitySlug}/forums/${forumSlug}/threads/${threadSlug}/replies`,
      { content },
    );
  }
}
