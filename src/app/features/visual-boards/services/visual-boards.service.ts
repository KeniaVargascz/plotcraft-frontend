import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PaginatedResponse } from '../../../core/models/feed-pagination.model';
import {
  VisualBoard,
  VisualBoardFilter,
  VisualBoardReorderItemPayload,
  VisualBoardReorderSectionPayload,
  VisualBoardSavePayload,
  VisualBoardSection,
  VisualBoardSummary,
} from '../models/visual-board.model';

@Injectable({ providedIn: 'root' })
export class VisualBoardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/visual-boards`;

  getMyBoards(query: VisualBoardFilter = {}) {
    return this.http
      .get<ApiResponse<VisualBoardSummary[]>>(this.baseUrl, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getPublicBoards(username: string, query: VisualBoardFilter = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<VisualBoardSummary>>>(
        `${this.baseUrl}/public/${username}`,
        {
          params: this.buildParams(query),
        },
      )
      .pipe(map((response) => response.data));
  }

  getBoardById(id: string) {
    return this.http
      .get<ApiResponse<VisualBoard>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createBoard(payload: VisualBoardSavePayload) {
    return this.http
      .post<ApiResponse<VisualBoardSummary>>(this.baseUrl, this.normalizeBoardPayload(payload))
      .pipe(map((response) => response.data));
  }

  updateBoard(id: string, payload: Partial<VisualBoardSavePayload>) {
    return this.http
      .patch<ApiResponse<VisualBoardSummary>>(
        `${this.baseUrl}/${id}`,
        this.normalizeBoardPayload(payload),
      )
      .pipe(map((response) => response.data));
  }

  deleteBoard(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  addSection(boardId: string, title: string) {
    return this.http
      .post<ApiResponse<VisualBoardSection>>(`${this.baseUrl}/${boardId}/sections`, { title })
      .pipe(map((response) => response.data));
  }

  updateSection(boardId: string, sectionId: string, title: string) {
    return this.http
      .patch<ApiResponse<VisualBoardSection>>(`${this.baseUrl}/${boardId}/sections/${sectionId}`, {
        title,
      })
      .pipe(map((response) => response.data));
  }

  deleteSection(boardId: string, sectionId: string) {
    return this.http.delete(`${this.baseUrl}/${boardId}/sections/${sectionId}`);
  }

  reorderSections(boardId: string, sections: VisualBoardReorderSectionPayload[]) {
    return this.http
      .patch<ApiResponse<VisualBoard>>(`${this.baseUrl}/${boardId}/sections/reorder`, { sections })
      .pipe(map((response) => response.data));
  }

  addItem(boardId: string, sectionId: string, payload: { imageUrl: string; caption?: string | null }) {
    return this.http
      .post<ApiResponse<unknown>>(`${this.baseUrl}/${boardId}/sections/${sectionId}/items`, payload)
      .pipe(map((response) => response.data));
  }

  updateItem(boardId: string, sectionId: string, itemId: string, caption: string | null) {
    return this.http
      .patch<ApiResponse<unknown>>(
        `${this.baseUrl}/${boardId}/sections/${sectionId}/items/${itemId}`,
        { caption },
      )
      .pipe(map((response) => response.data));
  }

  deleteItem(boardId: string, sectionId: string, itemId: string) {
    return this.http.delete(`${this.baseUrl}/${boardId}/sections/${sectionId}/items/${itemId}`);
  }

  reorderItems(
    boardId: string,
    sectionId: string,
    items: VisualBoardReorderItemPayload[],
  ) {
    return this.http
      .patch<ApiResponse<VisualBoard>>(
        `${this.baseUrl}/${boardId}/sections/${sectionId}/items/reorder`,
        { items },
      )
      .pipe(map((response) => response.data));
  }

  private buildParams(query: VisualBoardFilter) {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.linkedType) {
      params = params.set('linkedType', query.linkedType);
    }
    if (query.linkedId) {
      params = params.set('linkedId', query.linkedId);
    }
    if (query.isPublic !== undefined && query.isPublic !== null) {
      params = params.set('isPublic', String(query.isPublic));
    }

    return params;
  }

  private normalizeBoardPayload(payload: Partial<VisualBoardSavePayload>) {
    return {
      ...payload,
      description: payload.description?.trim() || null,
      coverUrl: payload.coverUrl?.trim() || null,
      linkedType: payload.linkedType ?? null,
      linkedId: payload.linkedId ?? null,
    };
  }
}
