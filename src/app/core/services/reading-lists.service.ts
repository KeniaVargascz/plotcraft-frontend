import { Injectable, inject } from '@angular/core';
import { ReadingList, ReadingListItem, ReadingListVisibility } from '../models/reading-list.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class ReadingListsService {
  private readonly api = inject(HttpApiService);

  listMine(novelId?: string) {
    const query = novelId ? `?novelId=${encodeURIComponent(novelId)}` : '';
    return this.api.get<ReadingList[]>(`/reading-lists/me${query}`);
  }

  getById(id: string) {
    return this.api.get<ReadingList>(`/reading-lists/${id}`);
  }

  create(payload: {
    name: string;
    description?: string | null;
    visibility?: ReadingListVisibility;
  }) {
    return this.api.post<ReadingList>('/reading-lists', payload);
  }

  update(
    id: string,
    payload: { name?: string; description?: string | null; visibility?: ReadingListVisibility },
  ) {
    return this.api.patch<ReadingList>(`/reading-lists/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/reading-lists/${id}`);
  }

  addItem(id: string, payload: { novelId: string; personal_note?: string | null }) {
    return this.api.post<ReadingListItem>(`/reading-lists/${id}/items`, payload);
  }

  removeItem(id: string, novelId: string) {
    return this.api.delete<{ message: string }>(`/reading-lists/${id}/items/${novelId}`);
  }

  updateItemNote(id: string, novelId: string, personal_note?: string | null) {
    return this.api.patch<ReadingListItem>(
      `/reading-lists/${id}/items/${novelId}`,
      { personal_note },
    );
  }
}
