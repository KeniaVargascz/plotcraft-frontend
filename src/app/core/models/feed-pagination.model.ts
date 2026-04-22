import type { PagePagination } from './pagination.model';

export type {
  CursorPagination,
  CursorPagination as FeedPagination,
  PagePagination,
  Pagination,
  CursorPaginatedResponse,
  CursorPaginatedResponse as PaginatedResponse,
  PagePaginatedResponse,
} from './pagination.model';

export interface PagedResponse<T> {
  data: T[];
  pagination: PagePagination;
}
