import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ChapterDetail, ChapterSummary } from '../models/chapter.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

type ChapterQuery = {
  cursor?: string | null;
  limit?: number;
};

@Injectable({ providedIn: 'root' })
export class ChaptersService {
  private readonly api = inject(HttpApiService);

  listPublished(
    novelSlug: string,
    query: ChapterQuery = {},
  ): Observable<PaginatedResponse<ChapterSummary>> {
    return this.api.get<PaginatedResponse<ChapterSummary>>(
      `/novels/${novelSlug}/chapters`,
      { params: this.buildParams(query) },
    );
  }

  listDrafts(
    novelSlug: string,
    query: ChapterQuery = {},
  ): Observable<PaginatedResponse<ChapterSummary>> {
    return this.api.get<PaginatedResponse<ChapterSummary>>(
      `/novels/${novelSlug}/chapters/drafts`,
      { params: this.buildParams(query) },
    );
  }

  getReaderChapter(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.api.get<ChapterDetail>(`/novels/${novelSlug}/chapters/${chapterSlug}`);
  }

  getEditorChapter(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.api.get<ChapterDetail>(`/novels/${novelSlug}/chapters/${chapterSlug}/edit`);
  }

  create(
    novelSlug: string,
    payload: { title: string; content: string },
  ): Observable<ChapterDetail> {
    return this.api.post<ChapterDetail>(`/novels/${novelSlug}/chapters`, payload);
  }

  update(
    novelSlug: string,
    chapterSlug: string,
    payload: { title?: string; content?: string },
  ): Observable<ChapterDetail> {
    return this.api.patch<ChapterDetail>(
      `/novels/${novelSlug}/chapters/${chapterSlug}`,
      payload,
    );
  }

  autosave(
    novelSlug: string,
    chapterSlug: string,
    payload: { title?: string; content?: string },
  ): Observable<{ savedAt: string; wordCount: number }> {
    return this.api.patch<{ savedAt: string; wordCount: number }>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/autosave`,
      payload,
    );
  }

  delete(novelSlug: string, chapterSlug: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/novels/${novelSlug}/chapters/${chapterSlug}`,
    );
  }

  publish(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.api.post<ChapterDetail>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/publish`,
      {},
    );
  }

  unpublish(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.api.post<ChapterDetail>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/unpublish`,
      {},
    );
  }

  schedule(novelSlug: string, chapterSlug: string, scheduledAt: string): Observable<ChapterDetail> {
    return this.api.post<ChapterDetail>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/schedule`,
      { scheduledAt },
    );
  }

  private buildParams(query: ChapterQuery) {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit) {
      params = params.set('limit', query.limit);
    }

    return params;
  }

  // ── Chapter Comments ──

  listChapterComments(novelSlug: string, chapterSlug: string, cursor?: string | null, limit = 20) {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.api.get<{
      commentsEnabled: boolean;
      data: ChapterCommentModel[];
      pagination: { nextCursor: string | null; hasMore: boolean; limit: number };
    }>(`/novels/${novelSlug}/chapters/${chapterSlug}/comments`, { params });
  }

  createChapterComment(novelSlug: string, chapterSlug: string, content: string) {
    return this.api.post<ChapterCommentModel>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/comments`,
      { content },
    );
  }

  deleteChapterComment(novelSlug: string, chapterSlug: string, commentId: string) {
    return this.api.delete<{ message: string }>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/comments/${commentId}`,
    );
  }

  createParagraphComment(
    novelSlug: string,
    chapterSlug: string,
    payload: {
      content: string;
      anchor_id: string;
      quoted_text: string;
      start_offset: number;
      end_offset: number;
    },
  ) {
    return this.api.post<ChapterCommentModel>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/comments/paragraph`,
      payload,
    );
  }

  listParagraphComments(
    novelSlug: string,
    chapterSlug: string,
    anchorId: string,
    cursor?: string | null,
    limit = 20,
  ) {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.api.get<{
      data: ChapterCommentModel[];
      pagination: { nextCursor: string | null; hasMore: boolean; limit: number };
    }>(
      `/novels/${novelSlug}/chapters/${chapterSlug}/comments/paragraph/${anchorId}`,
      { params },
    );
  }
}

export interface ChapterCommentModel {
  id: string;
  content: string;
  anchorId: string | null;
  quotedText: string | null;
  startOffset: number | null;
  endOffset: number | null;
  createdAt: string;
  isDeleted: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}
