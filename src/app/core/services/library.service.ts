import { Injectable, inject } from '@angular/core';
import {
  LibraryNovelCard,
  LibrarySummary,
  ReadingGoal,
  ReadingStats,
} from '../models/library.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { ReadingHistoryItem } from '../models/reader.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly api = inject(HttpApiService);

  getSummary() {
    return this.api.get<LibrarySummary>('/library');
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
    return this.api.get<PaginatedResponse<ReadingHistoryItem>>(
      '/library/history',
      {
        params: {
          ...(cursor ? { cursor } : {}),
          limit,
        },
      },
    );
  }

  listGoals() {
    return this.api.get<ReadingGoal[]>('/library/goals');
  }

  saveGoal(payload: { year: number; month?: number | null; target_words: number }) {
    return this.api.post<ReadingGoal>('/library/goals', payload);
  }

  getStats() {
    return this.api.get<ReadingStats>('/library/stats');
  }

  private listNovelBucket(path: string, cursor?: string | null, limit = 12) {
    return this.api.get<PaginatedResponse<LibraryNovelCard>>(path, {
      params: {
        ...(cursor ? { cursor } : {}),
        limit,
      },
    });
  }
}
