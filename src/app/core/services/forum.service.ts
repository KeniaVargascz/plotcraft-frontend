import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { ForumCategory, ThreadDetail, ThreadSummary } from '../models/forum-thread.model';
import { ForumReply } from '../models/forum-reply.model';
import { ForumPoll } from '../models/forum-poll.model';
import { HttpApiService } from './http-api.service';

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
  private readonly api = inject(HttpApiService);

  listThreads(query: ThreadQuery = {}): Observable<PaginatedResponse<ThreadSummary>> {
    return this.api.get<PaginatedResponse<ThreadSummary>>('/forum', {
      params: this.buildParams(query),
    });
  }

  getCategories(): Observable<ForumCategory[]> {
    return this.api.get<ForumCategory[]>('/forum/categories');
  }

  getThread(slug: string): Observable<ThreadDetail> {
    return this.api.get<ThreadDetail>(`/forum/${slug}`);
  }

  listUserThreads(
    username: string,
    query: ThreadQuery = {},
  ): Observable<PaginatedResponse<ThreadSummary>> {
    return this.api.get<PaginatedResponse<ThreadSummary>>(`/forum/user/${username}`, {
      params: this.buildParams(query),
    });
  }

  createThread(payload: {
    title: string;
    content: string;
    category: ForumCategory;
    tags?: string[];
    poll?: { question: string; options: string[]; closesAt?: string };
  }): Observable<ThreadDetail> {
    return this.api.post<ThreadDetail>('/forum', payload);
  }

  updateThread(
    slug: string,
    payload: { title?: string; content?: string; category?: ForumCategory; tags?: string[] },
  ): Observable<ThreadDetail> {
    return this.api.patch<ThreadDetail>(`/forum/${slug}`, payload);
  }

  deleteThread(slug: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/forum/${slug}`);
  }

  createReply(
    slug: string,
    payload: { content: string; parentReplyId?: string },
  ): Observable<ForumReply> {
    return this.api.post<ForumReply>(`/forum/${slug}/replies`, payload);
  }

  updateReply(slug: string, replyId: string, payload: { content: string }): Observable<ForumReply> {
    return this.api.patch<ForumReply>(`/forum/${slug}/replies/${replyId}`, payload);
  }

  deleteReply(slug: string, replyId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/forum/${slug}/replies/${replyId}`);
  }

  toggleThreadReaction(
    slug: string,
    payload?: { reactionType: string },
  ): Observable<{ reacted: boolean }> {
    return this.api.post<{ reacted: boolean }>(`/forum/${slug}/reactions`, payload ?? {});
  }

  toggleReplyReaction(
    slug: string,
    replyId: string,
    payload?: { reactionType: string },
  ): Observable<{ reacted: boolean }> {
    return this.api.post<{ reacted: boolean }>(
      `/forum/${slug}/replies/${replyId}/reactions`,
      payload ?? {},
    );
  }

  markSolution(slug: string, replyId: string): Observable<ForumReply> {
    return this.api.post<ForumReply>(`/forum/${slug}/replies/${replyId}/solution`, {});
  }

  unmarkSolution(slug: string, replyId: string): Observable<ForumReply> {
    return this.api.delete<ForumReply>(`/forum/${slug}/replies/${replyId}/solution`);
  }

  votePoll(slug: string, optionId: string): Observable<ForumPoll> {
    return this.api.post<ForumPoll>(`/forum/${slug}/vote`, { optionId });
  }

  removeVote(slug: string): Observable<ForumPoll> {
    return this.api.delete<ForumPoll>(`/forum/${slug}/vote`);
  }

  closeThread(slug: string): Observable<ThreadDetail> {
    return this.api.post<ThreadDetail>(`/forum/${slug}/close`, {});
  }

  openThread(slug: string): Observable<ThreadDetail> {
    return this.api.post<ThreadDetail>(`/forum/${slug}/open`, {});
  }

  archiveThread(slug: string) {
    return this.api.post<ThreadDetail>(`/forum/${slug}/archive`, {});
  }

  getTrendingTags(): Observable<{ tag: string; count: number }[]> {
    return this.api.get<{ tag: string; count: number }[]>('/forum/tags/trending');
  }

  getMyStats(): Observable<{ threadsCount: number; repliesCount: number; solutionsCount: number }> {
    return this.api.get<{ threadsCount: number; repliesCount: number; solutionsCount: number }>(
      '/forum/stats/me',
    );
  }

  listMyThreads(query: ThreadQuery = {}): Observable<PaginatedResponse<ThreadSummary>> {
    return this.api.get<PaginatedResponse<ThreadSummary>>('/forum/mine', {
      params: this.buildParams(query),
    });
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
      params = params.set('tags', query.tag);
    }

    return params;
  }
}
