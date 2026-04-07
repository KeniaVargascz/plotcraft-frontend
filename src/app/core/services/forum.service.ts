import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { ForumCategory, ThreadDetail, ThreadSummary } from '../models/forum-thread.model';
import { ForumReply } from '../models/forum-reply.model';
import { ForumPoll } from '../models/forum-poll.model';

type ThreadQuery = {
  cursor?: string | null;
  limit?: number;
  category?: ForumCategory | null;
  status?: string | null;
  search?: string | null;
  tag?: string | null;
  relevant?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/forum`;

  listThreads(query: ThreadQuery = {}): Observable<PaginatedResponse<ThreadSummary>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<ThreadSummary>>>(this.baseUrl, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getCategories(): Observable<ForumCategory[]> {
    return this.http
      .get<ApiResponse<ForumCategory[]>>(`${this.baseUrl}/categories`)
      .pipe(map((response) => response.data));
  }

  getThread(slug: string): Observable<ThreadDetail> {
    return this.http
      .get<ApiResponse<ThreadDetail>>(`${this.baseUrl}/${slug}`)
      .pipe(map((response) => response.data));
  }

  listUserThreads(username: string): Observable<ThreadSummary[]> {
    return this.http
      .get<ApiResponse<ThreadSummary[]>>(`${this.baseUrl}/user/${username}`)
      .pipe(map((response) => response.data));
  }

  createThread(payload: {
    title: string;
    content: string;
    category: ForumCategory;
    tags?: string[];
    poll?: { question: string; options: string[]; closesAt?: string };
  }): Observable<ThreadDetail> {
    return this.http
      .post<ApiResponse<ThreadDetail>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateThread(
    slug: string,
    payload: { title?: string; content?: string; category?: ForumCategory; tags?: string[] },
  ): Observable<ThreadDetail> {
    return this.http
      .patch<ApiResponse<ThreadDetail>>(`${this.baseUrl}/${slug}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteThread(slug: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${slug}`)
      .pipe(map((response) => response.data));
  }

  createReply(
    slug: string,
    payload: { content: string; parentReplyId?: string },
  ): Observable<ForumReply> {
    return this.http
      .post<ApiResponse<ForumReply>>(`${this.baseUrl}/${slug}/replies`, payload)
      .pipe(map((response) => response.data));
  }

  updateReply(
    slug: string,
    replyId: string,
    payload: { content: string },
  ): Observable<ForumReply> {
    return this.http
      .patch<ApiResponse<ForumReply>>(`${this.baseUrl}/${slug}/replies/${replyId}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteReply(slug: string, replyId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${slug}/replies/${replyId}`)
      .pipe(map((response) => response.data));
  }

  toggleThreadReaction(
    slug: string,
    payload?: { reactionType: string },
  ): Observable<{ reacted: boolean }> {
    return this.http
      .post<ApiResponse<{ reacted: boolean }>>(`${this.baseUrl}/${slug}/reactions`, payload ?? {})
      .pipe(map((response) => response.data));
  }

  toggleReplyReaction(
    slug: string,
    replyId: string,
    payload?: { reactionType: string },
  ): Observable<{ reacted: boolean }> {
    return this.http
      .post<
        ApiResponse<{ reacted: boolean }>
      >(`${this.baseUrl}/${slug}/replies/${replyId}/reactions`, payload ?? {})
      .pipe(map((response) => response.data));
  }

  markSolution(slug: string, replyId: string): Observable<ForumReply> {
    return this.http
      .post<ApiResponse<ForumReply>>(`${this.baseUrl}/${slug}/replies/${replyId}/solution`, {})
      .pipe(map((response) => response.data));
  }

  unmarkSolution(slug: string, replyId: string): Observable<ForumReply> {
    return this.http
      .delete<ApiResponse<ForumReply>>(`${this.baseUrl}/${slug}/replies/${replyId}/solution`)
      .pipe(map((response) => response.data));
  }

  votePoll(slug: string, optionId: string): Observable<ForumPoll> {
    return this.http
      .post<ApiResponse<ForumPoll>>(`${this.baseUrl}/${slug}/vote`, { optionId })
      .pipe(map((response) => response.data));
  }

  removeVote(slug: string): Observable<ForumPoll> {
    return this.http
      .delete<ApiResponse<ForumPoll>>(`${this.baseUrl}/${slug}/vote`)
      .pipe(map((response) => response.data));
  }

  closeThread(slug: string): Observable<ThreadDetail> {
    return this.http
      .post<ApiResponse<ThreadDetail>>(`${this.baseUrl}/${slug}/close`, {})
      .pipe(map((response) => response.data));
  }

  openThread(slug: string): Observable<ThreadDetail> {
    return this.http
      .post<ApiResponse<ThreadDetail>>(`${this.baseUrl}/${slug}/open`, {})
      .pipe(map((response) => response.data));
  }

  archiveThread(slug: string) {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/${slug}/archive`, {})
      .pipe(map((response) => response.data));
  }

  listMyThreads() {
    return this.http
      .get<ApiResponse<ThreadSummary[]>>(`${this.baseUrl}/mine`)
      .pipe(map((response) => response.data));
  }

  private buildParams(query: ThreadQuery): HttpParams {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }

    if (query.limit) {
      params = params.set('limit', query.limit);
    }

    if (query.category) {
      params = params.set('category', query.category);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.relevant) {
      params = params.set('relevant', 'true');
    }

    if (query.tag) {
      params = params.set('tag', query.tag);
    }

    return params;
  }
}
