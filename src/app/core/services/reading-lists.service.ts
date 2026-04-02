import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ReadingList, ReadingListItem, ReadingListVisibility } from '../models/reading-list.model';

@Injectable({ providedIn: 'root' })
export class ReadingListsService {
  private readonly http = inject(HttpClient);

  listMine(novelId?: string) {
    const query = novelId ? `?novel_id=${encodeURIComponent(novelId)}` : '';
    return this.http
      .get<ApiResponse<ReadingList[]>>(`${environment.apiUrl}/reading-lists/me${query}`)
      .pipe(map((response) => response.data));
  }

  getById(id: string) {
    return this.http
      .get<ApiResponse<ReadingList>>(`${environment.apiUrl}/reading-lists/${id}`)
      .pipe(map((response) => response.data));
  }

  create(payload: {
    name: string;
    description?: string | null;
    visibility?: ReadingListVisibility;
  }) {
    return this.http
      .post<ApiResponse<ReadingList>>(`${environment.apiUrl}/reading-lists`, payload)
      .pipe(map((response) => response.data));
  }

  update(
    id: string,
    payload: { name?: string; description?: string | null; visibility?: ReadingListVisibility },
  ) {
    return this.http
      .patch<ApiResponse<ReadingList>>(`${environment.apiUrl}/reading-lists/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/reading-lists/${id}`,
    );
  }

  addItem(id: string, payload: { novel_id: string; personal_note?: string | null }) {
    return this.http
      .post<
        ApiResponse<ReadingListItem>
      >(`${environment.apiUrl}/reading-lists/${id}/items`, payload)
      .pipe(map((response) => response.data));
  }

  removeItem(id: string, novelId: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/reading-lists/${id}/items/${novelId}`,
    );
  }

  updateItemNote(id: string, novelId: string, personal_note?: string | null) {
    return this.http
      .patch<
        ApiResponse<ReadingListItem>
      >(`${environment.apiUrl}/reading-lists/${id}/items/${novelId}`, { personal_note })
      .pipe(map((response) => response.data));
  }
}
