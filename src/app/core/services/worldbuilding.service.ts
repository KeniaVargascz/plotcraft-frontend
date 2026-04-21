import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { FieldDefinition, FieldValue } from '../models/field-definition.model';
import { WbCategory, WbCategorySummary, CategoryTemplate } from '../models/wb-category.model';
import { WbEntryDetail, WbEntrySummary, WbEntryLink } from '../models/wb-entry.model';
import { HttpApiService } from './http-api.service';

export type EntryQuery = {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  tags?: string | null;
  isPublic?: boolean | null;
  sort?: 'recent' | 'updated' | 'name' | 'sortOrder' | null;
};

type CategoryPayload = {
  name: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  fieldSchema?: FieldDefinition[];
};

type UpdateCategoryPayload = Partial<{
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  fieldSchema: FieldDefinition[];
}>;

type EntryPayload = {
  name: string;
  categoryId: string;
  summary?: string | null;
  content?: string | null;
  coverUrl?: string | null;
  fields?: Record<string, FieldValue>;
  tags?: string[];
  isPublic?: boolean;
};

type UpdateEntryPayload = Partial<{
  name: string;
  summary: string | null;
  content: string | null;
  coverUrl: string | null;
  fields: Record<string, FieldValue>;
  tags: string[];
  isPublic: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class WorldbuildingService {
  private readonly api = inject(HttpApiService);

  /* ─── Categories ─── */

  listCategories(worldSlug: string) {
    return this.api.get<WbCategorySummary[]>(`/worlds/${worldSlug}/wb/categories`);
  }

  getCategory(worldSlug: string, catSlug: string) {
    return this.api.get<WbCategory>(`/worlds/${worldSlug}/wb/categories/${catSlug}`);
  }

  createCategory(worldSlug: string, payload: CategoryPayload) {
    return this.api.post<WbCategory>(`/worlds/${worldSlug}/wb/categories`, payload);
  }

  updateCategory(worldSlug: string, catSlug: string, payload: UpdateCategoryPayload) {
    return this.api.patch<WbCategory>(
      `/worlds/${worldSlug}/wb/categories/${catSlug}`,
      payload,
    );
  }

  deleteCategory(worldSlug: string, catSlug: string) {
    return this.api.delete<{ message: string }>(
      `/worlds/${worldSlug}/wb/categories/${catSlug}`,
    );
  }

  reorderCategories(worldSlug: string, items: Array<{ id: string; sortOrder: number }>) {
    return this.api.patch<{ message: string }>(
      `/worlds/${worldSlug}/wb/categories/reorder`,
      { items },
    );
  }

  /* ─── Templates ─── */

  listTemplates() {
    return this.api.get<CategoryTemplate[]>('/worlds/wb/templates');
  }

  instantiateTemplate(
    worldSlug: string,
    payload: { templateKey: string; name?: string; icon?: string; color?: string },
  ) {
    return this.api.post<WbCategory>(
      `/worlds/${worldSlug}/wb/categories/from-template`,
      payload,
    );
  }

  /* ─── Entries ─── */

  listEntries(worldSlug: string, query: EntryQuery = {}) {
    return this.api.get<PaginatedResponse<WbEntrySummary>>(
      `/worlds/${worldSlug}/wb/entries`,
      { params: this.buildParams(query) },
    );
  }

  listCategoryEntries(worldSlug: string, catSlug: string, query: EntryQuery = {}) {
    return this.api.get<PaginatedResponse<WbEntrySummary>>(
      `/worlds/${worldSlug}/wb/categories/${catSlug}/entries`,
      { params: this.buildParams(query) },
    );
  }

  getEntry(worldSlug: string, entrySlug: string) {
    return this.api.get<WbEntryDetail>(`/worlds/${worldSlug}/wb/entries/${entrySlug}`);
  }

  createEntry(worldSlug: string, payload: EntryPayload) {
    return this.api.post<WbEntryDetail>(`/worlds/${worldSlug}/wb/entries`, payload);
  }

  updateEntry(worldSlug: string, entrySlug: string, payload: UpdateEntryPayload) {
    return this.api.patch<WbEntryDetail>(
      `/worlds/${worldSlug}/wb/entries/${entrySlug}`,
      payload,
    );
  }

  deleteEntry(worldSlug: string, entrySlug: string) {
    return this.api.delete<{ message: string }>(
      `/worlds/${worldSlug}/wb/entries/${entrySlug}`,
    );
  }

  reorderEntries(
    worldSlug: string,
    catSlug: string,
    items: Array<{ id: string; sortOrder: number }>,
  ) {
    return this.api.patch<{ message: string }>(
      `/worlds/${worldSlug}/wb/categories/${catSlug}/entries/reorder`,
      { items },
    );
  }

  /* ─── Links ─── */

  createLink(
    worldSlug: string,
    entrySlug: string,
    payload: { targetEntryId: string; relation: string; isMutual?: boolean },
  ) {
    return this.api.post<WbEntryLink>(
      `/worlds/${worldSlug}/wb/entries/${entrySlug}/links`,
      payload,
    );
  }

  deleteLink(worldSlug: string, entrySlug: string, linkId: string) {
    return this.api.delete<{ message: string }>(
      `/worlds/${worldSlug}/wb/entries/${entrySlug}/links/${linkId}`,
    );
  }

  listLinks(worldSlug: string, entrySlug: string) {
    return this.api.get<WbEntryLink[]>(
      `/worlds/${worldSlug}/wb/entries/${entrySlug}/links`,
    );
  }

  /* ─── Search ─── */

  searchEntries(worldSlug: string, query: string) {
    return this.api.get<PaginatedResponse<WbEntrySummary>>(
      `/worlds/${worldSlug}/wb/search`,
      { params: new HttpParams().set('q', query) },
    );
  }

  /* ─── Helpers ─── */

  private buildParams(query: EntryQuery) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.tags) params = params.set('tags', query.tags);
    if (query.isPublic !== null && query.isPublic !== undefined) {
      params = params.set('isPublic', query.isPublic);
    }
    if (query.sort) params = params.set('sort', query.sort);
    return params;
  }
}
