import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Highlight, HighlightColor } from '../models/highlight.model';

@Injectable({ providedIn: 'root' })
export class HighlightsService {
  private readonly http = inject(HttpClient);

  listByChapter(chapterId: string) {
    return this.http
      .get<ApiResponse<Highlight[]>>(`${environment.apiUrl}/highlights/chapter/${chapterId}`)
      .pipe(map((response) => response.data));
  }

  listAll(novelId?: string) {
    return this.http
      .get<ApiResponse<Highlight[]>>(`${environment.apiUrl}/highlights`, {
        params: novelId ? { novel_id: novelId } : {},
      })
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
