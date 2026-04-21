import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { Highlight, HighlightColor } from '../models/highlight.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class HighlightsService {
  private readonly api = inject(HttpApiService);

  listByChapter(chapterId: string) {
    return this.api.get<Highlight[]>(`/highlights/chapter/${chapterId}`);
  }

  listAll(query: { cursor?: string | null; limit?: number; novel_id?: string } = {}) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.novel_id) params = params.set('novel_id', query.novel_id);
    return this.api.get<PaginatedResponse<Highlight>>('/highlights', { params });
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
    return this.api.post<Highlight>('/highlights', payload);
  }

  update(id: string, payload: { color?: HighlightColor; note?: string | null }) {
    return this.api.patch<Highlight>(`/highlights/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/highlights/${id}`);
  }
}
