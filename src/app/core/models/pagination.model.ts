export interface CursorPagination {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface PagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export type Pagination = CursorPagination | PagePagination;

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

export interface PagePaginatedResponse<T> {
  data: T[];
  pagination: PagePagination;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
