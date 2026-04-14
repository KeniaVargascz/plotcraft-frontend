import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { Highlight, HighlightColor } from '../models/highlight.model';

@Injectable({ providedIn: 'root' })
export class HighlightsService {
  private readonly http = inject(HttpClient);

  listByChapter(chapterId: string) {
    return this.http
      .get<ApiResponse<Highlight[]>>(`${environment.apiUrl}/highlights/chapter/${chapterId}`)
      .pipe(map((response) => response.data));
  }

  listAll(query: { cursor?: string | null; limit?: number; novel_id?: string } = {}) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.novel_id) params = params.set('novel_id', query.novel_id);
    return this.http
      .get<ApiResponse<PaginatedResponse<Highlight>>>(`${environment.apiUrl}/highlights`, { params })
      .pipe(map((response) => response.data));
  }

  create(payload: {
    novel_id: string;
    chapter_id: string;
    anchor_id: string;
    start_offset: number;
    end_offset: number;
    color?: HighlightColor;
    note?: string | null;
  }) {
    return this.http
      .post<ApiResponse<Highlight>>(`${environment.apiUrl}/highlights`, payload)
      .pipe(map((response) => response.data));
  }

  update(id: string, payload: { color?: HighlightColor; note?: string | null }) {
    return this.http
      .patch<ApiResponse<Highlight>>(`${environment.apiUrl}/highlights/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/highlights/${id}`,
    );
  }
}
