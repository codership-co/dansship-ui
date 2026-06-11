import { useCallback, useEffect, useState } from 'react';

import { useCallablePromise } from '..';

import { useAuth } from '@contexts';
import { DansshipAPI, Figure, GetFiguresParams } from '@core/api';

export interface BrowseFigureFilters extends Omit<GetFiguresParams, 'limit' | 'offset'> {}

export const useFigures = () => {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<BrowseFigureFilters>({
    sortBy: 'name',
  });
  const { isLoading, call } = useCallablePromise((payload: GetFiguresParams) =>
    DansshipAPI.figures.getFigures(payload),
  );
  const [figures, setFigures] = useState<Array<Figure>>([]);
  const [offset, setOffset] = useState<number | undefined>(0);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const loadNextPage = useCallback(async () => {
    const { data } = await call({
      ...filters,
      offset,
      limit: 20,
    });

    if (data) {
      setTotal(data.total);
      setFigures(figures => {
        const newFigures = [...figures, ...data.figures];
        setOffset(newFigures.length < data.total ? newFigures.length : undefined);

        return newFigures;
      });
    }
  }, [call, filters, offset]);

  useEffect(() => {
    if (offset === 0 && isAuthenticated) {
      void loadNextPage();
    }
  }, [loadNextPage, offset, isAuthenticated]);

  return {
    filters,
    setFilters,
    figures,
    isLoading,
    hasMore: figures.length < (total ?? 0),
    total,
    loadNextPage,
  };
};
