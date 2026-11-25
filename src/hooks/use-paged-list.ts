import { useState } from 'react';

import { usePromise } from './use-promise';

import type { OffsetPage, OffsetPageParams } from '@core/api';

export const DEFAULT_PAGE_SIZE = 20;

interface PageResult<Item> {
  data: OffsetPage<Item> | null;
}

/**
 * One offset-paginated list: keeps the current page and fetches it. The API orders and paginates,
 * so the screen never loads every item. Pair it with `ListPagination`.
 */
export const usePagedList = <Item>(
  fetchPage: (params: OffsetPageParams) => Promise<PageResult<Item>>,
  pageSize: number = DEFAULT_PAGE_SIZE,
) => {
  const [page, setPage] = useState(1);
  const { response, isLoading } = usePromise(
    () => fetchPage({ limit: pageSize, offset: (page - 1) * pageSize }),
    true,
    [page, pageSize],
  );

  return {
    items: response?.data?.items ?? [],
    total: response?.data?.total ?? 0,
    page,
    pageSize,
    setPage,
    isLoading: isLoading || response === null,
  };
};
