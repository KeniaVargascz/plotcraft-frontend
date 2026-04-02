import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ReaderPreferences, ReadingHistoryItem, ReadingProgress } from '../models/reader.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

@Injectable({ providedIn: 'root' })
export class ReaderService {
  private readonly http = inject(HttpClient);

  getPreferences() {
    return this.http
      .get<ApiResponse<ReaderPreferences>>(`${environment.apiUrl}/reader/preferences`)
      .pipe(map((response) => response.data));
  }

  updatePreferences(payload: Partial<ReaderPreferences>) {
    return this.http
      .patch<ApiResponse<ReaderPreferences>>(`${environment.apiUrl}/reader/preferences`, payload)
      .pipe(map((response) => response.data));
  }

  getProgress(novelId: string) {
    return this.http
      .get<ApiResponse<ReadingProgress | null>>(`${environment.apiUrl}/reader/progress/${novelId}`)
      .pipe(map((response) => response.data));
  }

  saveProgress(payload: { novel_id: string; chapter_id: string; scroll_pct: number }) {
    return this.http
      .post<ApiResponse<ReadingProgress>>(`${environment.apiUrl}/reader/progress`, payload)
      .pipe(map((response) => response.data));
  }

  addHistory(payload: { novel_id: string; chapter_id: string }) {
    return this.http
      .post<ApiResponse<ReadingHistoryItem>>(`${environment.apiUrl}/reader/history`, payload)
      .pipe(map((response) => response.data));
  }

  listHistory(cursor?: string | null, limit = 12) {
    return this.http
      .get<ApiResponse<PaginatedResponse<ReadingHistoryItem>>>(
        `${environment.apiUrl}/reader/history`,
        {
          params: {
            ...(cursor ? { cursor } : {}),
            limit,
          },
        },
      )
      .pipe(map((response) => response.data));
  }
}
