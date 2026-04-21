import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpApiService } from '../../../core/services/http-api.service';
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
  private readonly api = inject(HttpApiService);

  getMyBoards(query: VisualBoardFilter = {}) {
    return this.api.get<VisualBoardSummary[]>('/visual-boards', {
      params: this.buildParams(query),
    });
  }

  getPublicBoards(username: string, query: VisualBoardFilter = {}) {
    return this.api.get<PaginatedResponse<VisualBoardSummary>>(
      `/visual-boards/public/${username}`,
      {
        params: this.buildParams(query),
      },
    );
  }

  getBoardById(id: string) {
    return this.api.get<VisualBoard>(`/visual-boards/${id}`);
  }

  createBoard(payload: VisualBoardSavePayload) {
    return this.api.post<VisualBoardSummary>(
      '/visual-boards',
      this.normalizeBoardPayload(payload),
    );
  }

  updateBoard(id: string, payload: Partial<VisualBoardSavePayload>) {
    return this.api.patch<VisualBoardSummary>(
      `/visual-boards/${id}`,
      this.normalizeBoardPayload(payload),
    );
  }

  deleteBoard(id: string) {
    const { http, baseUrl } = this.api.raw();
    return http.delete(`${baseUrl}/visual-boards/${id}`);
  }

  addSection(boardId: string, title: string) {
    return this.api.post<VisualBoardSection>(`/visual-boards/${boardId}/sections`, { title });
  }

  updateSection(boardId: string, sectionId: string, title: string) {
    return this.api.patch<VisualBoardSection>(
      `/visual-boards/${boardId}/sections/${sectionId}`,
      { title },
    );
  }

  deleteSection(boardId: string, sectionId: string) {
    const { http, baseUrl } = this.api.raw();
    return http.delete(`${baseUrl}/visual-boards/${boardId}/sections/${sectionId}`);
  }

  reorderSections(boardId: string, sections: VisualBoardReorderSectionPayload[]) {
    return this.api.patch<VisualBoard>(
      `/visual-boards/${boardId}/sections/reorder`,
      { sections },
    );
  }

  addItem(
    boardId: string,
    sectionId: string,
    payload: { imageUrl: string; caption?: string | null },
  ) {
    return this.api.post<unknown>(
      `/visual-boards/${boardId}/sections/${sectionId}/items`,
      payload,
    );
  }

  updateItem(boardId: string, sectionId: string, itemId: string, caption: string | null) {
    return this.api.patch<unknown>(
      `/visual-boards/${boardId}/sections/${sectionId}/items/${itemId}`,
      { caption },
    );
  }

  deleteItem(boardId: string, sectionId: string, itemId: string) {
    const { http, baseUrl } = this.api.raw();
    return http.delete(
      `${baseUrl}/visual-boards/${boardId}/sections/${sectionId}/items/${itemId}`,
    );
  }

  reorderItems(boardId: string, sectionId: string, items: VisualBoardReorderItemPayload[]) {
    return this.api.patch<VisualBoard>(
      `/visual-boards/${boardId}/sections/${sectionId}/items/reorder`,
      { items },
    );
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
