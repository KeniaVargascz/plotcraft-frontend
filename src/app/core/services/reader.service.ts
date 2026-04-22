import { Injectable, inject } from '@angular/core';
import { ReaderPreferences, ReadingHistoryItem, ReadingProgress } from '../models/reader.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class ReaderService {
  private readonly api = inject(HttpApiService);

  getPreferences() {
    return this.api.get<ReaderPreferences>('/reader/preferences');
  }

  updatePreferences(payload: Partial<ReaderPreferences>) {
    return this.api.patch<ReaderPreferences>('/reader/preferences', payload);
  }

  getProgress(novelId: string) {
    return this.api.get<ReadingProgress | null>(`/reader/progress/${novelId}`);
  }

  saveProgress(payload: { novelId: string; chapterId: string; scrollPct: number }) {
    return this.api.post<ReadingProgress>('/reader/progress', payload);
  }

  addHistory(payload: { novelId: string; chapterId: string }) {
    return this.api.post<ReadingHistoryItem>('/reader/history', payload);
  }

  listHistory(cursor?: string | null, limit = 12) {
    return this.api.get<PaginatedResponse<ReadingHistoryItem>>(
      '/reader/history',
      {
        params: {
          ...(cursor ? { cursor } : {}),
          limit,
        },
      },
    );
  }
}
