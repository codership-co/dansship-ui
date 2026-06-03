export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  totalCount: number;
  items: Array<T>;
}

export interface OffsetPaginatedResponse<T> {
  data: Array<T>;
  total: number;
  limit: number;
  offset: number;
}
