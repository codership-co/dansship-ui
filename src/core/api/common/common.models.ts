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

/** `?limit=&offset=` of an offset-paginated endpoint. */
export interface OffsetPageParams {
  limit: number;
  offset: number;
}

/** The API's shared page envelope (`src/domains/common/pagination`): `{ items, total, limit, offset }`. */
export interface OffsetPage<T> {
  items: Array<T>;
  total: number;
  limit: number;
  offset: number;
}
