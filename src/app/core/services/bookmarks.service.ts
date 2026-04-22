import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ReaderBookmark } from '../models/bookmark.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class BookmarksService {
  private readonly api = inject(HttpApiService);

  listAll(cursor?: string | null, limit?: number) {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    if (limit) params = params.set('limit', limit);
    return this.api.get<PaginatedResponse<ReaderBookmark>>('/bookmarks', { params });
  }

  listByChapter(chapterId: string) {
    return this.api.get<ReaderBookmark[]>(`/bookmarks/chapter/${chapterId}`);
  }

  create(payload: {
    novelId: string;
    chapterId: string;
    anchorId?: string | null;
    label?: string | null;
  }) {
    return this.api.post<ReaderBookmark>('/bookmarks', payload);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/bookmarks/${id}`);
  }
}
