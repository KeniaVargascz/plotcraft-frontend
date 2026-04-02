import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  LibraryNovelCard,
  LibrarySummary,
  ReadingGoal,
  ReadingStats,
} from '../models/library.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { ReadingHistoryItem } from '../models/reader.model';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);

  getSummary() {
    return this.http
      .get<ApiResponse<LibrarySummary>>(`${environment.apiUrl}/library`)
      .pipe(map((response) => response.data));
  }

  listInProgress(cursor?: string | null, limit = 12) {
    return this.listNovelBucket('/library/in-progress', cursor, limit);
  }

  listCompleted(cursor?: string | null, limit = 12) {
    return this.listNovelBucket('/library/completed', cursor, limit);
  }

  listBookmarked(cursor?: string | null, limit = 12) {
    return this.listNovelBucket('/library/bookmarked', cursor, limit);
  }

  listHistory(cursor?: string | null, limit = 20) {
    return this.http
      .get<ApiResponse<PaginatedResponse<ReadingHistoryItem>>>(
        `${environment.apiUrl}/library/history`,
        {
          params: {
            ...(cursor ? { cursor } : {}),
            limit,
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  listGoals() {
    return this.http
      .get<ApiResponse<ReadingGoal[]>>(`${environment.apiUrl}/library/goals`)
      .pipe(map((response) => response.data));
  }

  saveGoal(payload: { year: number; month?: number | null; target_words: number }) {
    return this.http
      .post<ApiResponse<ReadingGoal>>(`${environment.apiUrl}/library/goals`, payload)
      .pipe(map((response) => response.data));
  }

  getStats() {
    return this.http
      .get<ApiResponse<ReadingStats>>(`${environment.apiUrl}/library/stats`)
      .pipe(map((response) => response.data));
  }

  private listNovelBucket(path: string, cursor?: string | null, limit = 12) {
    return this.http
      .get<ApiResponse<PaginatedResponse<LibraryNovelCard>>>(`${environment.apiUrl}${path}`, {
        params: {
          ...(cursor ? { cursor } : {}),
          limit,
        },
      })
      .pipe(map((response) => response.data));
  }
}
