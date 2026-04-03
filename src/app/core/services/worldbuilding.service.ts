import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { WbCategory, WbCategorySummary, CategoryTemplate } from '../models/wb-category.model';
import { WbEntryDetail, WbEntrySummary, WbEntryLink } from '../models/wb-entry.model';

export type EntryQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  tags?: string | null;
  isPublic?: boolean | null;
  sort?: 'recent' | 'updated' | 'name' | 'sortOrder' | null;
};

@Injectable({ providedIn: 'root' })
export class WorldbuildingService {
  private readonly http = inject(HttpClient);

  /* ─── Categories ─── */

  listCategories(worldSlug: string) {
    return this.http
      .get<ApiResponse<WbCategorySummary[]>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories`,
      )
      .pipe(map((r) => r.data));
  }

  getCategory(worldSlug: string, catSlug: string) {
    return this.http
      .get<ApiResponse<WbCategory>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/${catSlug}`,
      )
      .pipe(map((r) => r.data));
  }

  createCategory(
    worldSlug: string,
    payload: { name: string; icon?: string | null; color?: string | null; description?: string | null; fieldSchema?: any[] },
  ) {
    return this.http
      .post<ApiResponse<WbCategory>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  updateCategory(
    worldSlug: string,
    catSlug: string,
    payload: Partial<{ name: string; icon: string | null; color: string | null; description: string | null; fieldSchema: any[] }>,
  ) {
    return this.http
      .patch<ApiResponse<WbCategory>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/${catSlug}`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteCategory(worldSlug: string, catSlug: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/${catSlug}`,
      )
      .pipe(map((r) => r.data));
  }

  reorderCategories(worldSlug: string, items: Array<{ id: string; sortOrder: number }>) {
    return this.http
      .patch<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/reorder`,
        { items },
      )
      .pipe(map((r) => r.data));
  }

  /* ─── Templates ─── */

  listTemplates() {
    return this.http
      .get<ApiResponse<CategoryTemplate[]>>(
        `${environment.apiUrl}/worlds/wb/templates`,
      )
      .pipe(map((r) => r.data));
  }

  instantiateTemplate(
    worldSlug: string,
    payload: { templateKey: string; name?: string; icon?: string; color?: string },
  ) {
    return this.http
      .post<ApiResponse<WbCategory>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/from-template`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  /* ─── Entries ─── */

  listEntries(worldSlug: string, query: EntryQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WbEntrySummary>>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries`,
        { params: this.buildParams(query) },
      )
      .pipe(map((r) => r.data));
  }

  listCategoryEntries(worldSlug: string, catSlug: string, query: EntryQuery = {}) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WbEntrySummary>>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/${catSlug}/entries`,
        { params: this.buildParams(query) },
      )
      .pipe(map((r) => r.data));
  }

  getEntry(worldSlug: string, entrySlug: string) {
    return this.http
      .get<ApiResponse<WbEntryDetail>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}`,
      )
      .pipe(map((r) => r.data));
  }

  createEntry(
    worldSlug: string,
    payload: {
      name: string;
      categoryId: string;
      summary?: string | null;
      content?: string | null;
      coverUrl?: string | null;
      fields?: Record<string, any>;
      tags?: string[];
      isPublic?: boolean;
    },
  ) {
    return this.http
      .post<ApiResponse<WbEntryDetail>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  updateEntry(
    worldSlug: string,
    entrySlug: string,
    payload: Partial<{
      name: string;
      summary: string | null;
      content: string | null;
      coverUrl: string | null;
      fields: Record<string, any>;
      tags: string[];
      isPublic: boolean;
    }>,
  ) {
    return this.http
      .patch<ApiResponse<WbEntryDetail>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteEntry(worldSlug: string, entrySlug: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}`,
      )
      .pipe(map((r) => r.data));
  }

  reorderEntries(worldSlug: string, catSlug: string, items: Array<{ id: string; sortOrder: number }>) {
    return this.http
      .patch<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/categories/${catSlug}/entries/reorder`,
        { items },
      )
      .pipe(map((r) => r.data));
  }

  /* ─── Links ─── */

  createLink(
    worldSlug: string,
    entrySlug: string,
    payload: { targetEntryId: string; relation: string; isMutual?: boolean },
  ) {
    return this.http
      .post<ApiResponse<WbEntryLink>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}/links`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteLink(worldSlug: string, entrySlug: string, linkId: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}/links/${linkId}`,
      )
      .pipe(map((r) => r.data));
  }

  listLinks(worldSlug: string, entrySlug: string) {
    return this.http
      .get<ApiResponse<WbEntryLink[]>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/entries/${entrySlug}/links`,
      )
      .pipe(map((r) => r.data));
  }

  /* ─── Search ─── */

  searchEntries(worldSlug: string, query: string) {
    return this.http
      .get<ApiResponse<PaginatedResponse<WbEntrySummary>>>(
        `${environment.apiUrl}/worlds/${worldSlug}/wb/search`,
        { params: new HttpParams().set('q', query) },
      )
      .pipe(map((r) => r.data));
  }

  /* ─── Helpers ─── */

  private buildParams(query: EntryQuery) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.tags) params = params.set('tags', query.tags);
    if (query.isPublic !== null && query.isPublic !== undefined) params = params.set('isPublic', query.isPublic);
    if (query.sort) params = params.set('sort', query.sort);
    return params;
  }
}
