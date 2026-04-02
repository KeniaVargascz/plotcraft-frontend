import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChapterDetail, ChapterSummary } from '../models/chapter.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

type ChapterQuery = {
  cursor?: string | null;
  limit?: number;
};

@Injectable({ providedIn: 'root' })
export class ChaptersService {
  private readonly http = inject(HttpClient);

  listPublished(
    novelSlug: string,
    query: ChapterQuery = {},
  ): Observable<PaginatedResponse<ChapterSummary>> {
    return this.http
      .get<
        ApiResponse<PaginatedResponse<ChapterSummary>>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters`, { params: this.buildParams(query) })
      .pipe(map((response) => response.data));
  }

  listDrafts(
    novelSlug: string,
    query: ChapterQuery = {},
  ): Observable<PaginatedResponse<ChapterSummary>> {
    return this.http
      .get<
        ApiResponse<PaginatedResponse<ChapterSummary>>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/drafts`, { params: this.buildParams(query) })
      .pipe(map((response) => response.data));
  }

  getReaderChapter(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.http
      .get<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}`)
      .pipe(map((response) => response.data));
  }

  getEditorChapter(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.http
      .get<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}/edit`)
      .pipe(map((response) => response.data));
  }

  create(
    novelSlug: string,
    payload: { title: string; content: string },
  ): Observable<ChapterDetail> {
    return this.http
      .post<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters`, payload)
      .pipe(map((response) => response.data));
  }

  update(
    novelSlug: string,
    chapterSlug: string,
    payload: { title?: string; content?: string },
  ): Observable<ChapterDetail> {
    return this.http
      .patch<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}`, payload)
      .pipe(map((response) => response.data));
  }

  autosave(
    novelSlug: string,
    chapterSlug: string,
    payload: { title?: string; content?: string },
  ): Observable<{ savedAt: string; wordCount: number }> {
    return this.http
      .patch<
        ApiResponse<{ savedAt: string; wordCount: number }>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}/autosave`, payload)
      .pipe(map((response) => response.data));
  }

  delete(novelSlug: string, chapterSlug: string): Observable<{ message: string }> {
    return this.http
      .delete<
        ApiResponse<{ message: string }>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}`)
      .pipe(map((response) => response.data));
  }

  publish(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.http
      .post<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}/publish`, {})
      .pipe(map((response) => response.data));
  }

  unpublish(novelSlug: string, chapterSlug: string): Observable<ChapterDetail> {
    return this.http
      .post<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}/unpublish`, {})
      .pipe(map((response) => response.data));
  }

  schedule(novelSlug: string, chapterSlug: string, scheduledAt: string): Observable<ChapterDetail> {
    return this.http
      .post<
        ApiResponse<ChapterDetail>
      >(`${environment.apiUrl}/novels/${novelSlug}/chapters/${chapterSlug}/schedule`, { scheduledAt })
      .pipe(map((response) => response.data));
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
}
