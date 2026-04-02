export interface FeedPagination {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: FeedPagination;
}
