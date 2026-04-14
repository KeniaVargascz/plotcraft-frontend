export interface FeedPagination {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: FeedPagination;
}

export interface PagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: PagePagination;
}
