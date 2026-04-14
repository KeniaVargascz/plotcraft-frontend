import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ReaderBookmark } from '../models/bookmark.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

@Injectable({ providedIn: 'root' })
export class BookmarksService {
  private readonly http = inject(HttpClient);

  listAll(cursor?: string | null, limit?: number) {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    if (limit) params = params.set('limit', limit);
    return this.http
      .get<
        ApiResponse<PaginatedResponse<ReaderBookmark>>
      >(`${environment.apiUrl}/bookmarks`, { params })
      .pipe(map((response) => response.data));
  }

  listByChapter(chapterId: string) {
    return this.http
      .get<ApiResponse<ReaderBookmark[]>>(`${environment.apiUrl}/bookmarks/chapter/${chapterId}`)
      .pipe(map((response) => response.data));
  }

  create(payload: {
    novel_id: string;
    chapter_id: string;
    anchor_id?: string | null;
    label?: string | null;
  }) {
    return this.http
      .post<ApiResponse<ReaderBookmark>>(`${environment.apiUrl}/bookmarks`, payload)
      .pipe(map((response) => response.data));
  }

  remove(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/bookmarks/${id}`,
    );
  }
}
