import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { FigureCatalogCard } from '@components/modules';
import { Figure } from '@core/api';
import { BrowseFigureFilters } from '@hooks';

interface FigureCatalogResultsProps {
  filters: BrowseFigureFilters;
  setFilters: React.Dispatch<React.SetStateAction<BrowseFigureFilters>>;
  figures: Array<Figure>;
  isLoading: boolean;
  hasMore: boolean;
  total: number;
  loadNextPage: () => Promise<void>;
}

export const FigureCatalogResults = ({
  filters,
  setFilters,
  figures,
  isLoading,
  hasMore,
  total,
  loadNextPage,
}: FigureCatalogResultsProps) => {
  const { t } = useTranslation();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadNextPage]);

  return (
    <section className='min-w-0 flex-1'>
      <div className='mb-6 flex items-end justify-between border-b border-[hsl(var(--surface-container))] pb-3'>
        <p className='font-label text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm'>
          {t('browse:catalog.resultsFound', {
            count: total,
          })}
        </p>

        <div className='flex items-center gap-2'>
          <span className='hidden font-label text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground sm:block'>
            {t('browse:catalog.sortByLabel')}
          </span>
          <select
            className='rounded-lg border border-[hsl(var(--outline-variant)/0.6)] bg-transparent px-3 py-1.5 text-sm font-medium text-primary outline-none focus:border-primary focus:ring-0'
            value={filters.sortBy}
            onChange={event => {
              setFilters(previous => ({
                ...previous,
                sortBy: event.target.value as 'name' | 'difficulty',
              }));
            }}
          >
            <option value='name'>{t('browse:catalog.sortOptions.name')}</option>
            <option value='difficulty'>{t('browse:catalog.sortOptions.difficulty')}</option>
          </select>
        </div>
      </div>

      {figures.length === 0 && isLoading ? <SpinnerLoader /> : null}

      {figures.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
          {figures.map(figure => (
            <FigureCatalogCard key={figure.id} figure={figure} />
          ))}
        </div>
      ) : null}

      {figures.length === 0 && !isLoading ? (
        <div className='rounded-xl border border-dashed border-[hsl(var(--outline-variant)/0.5)] bg-[hsl(var(--surface-container-lowest))] p-10 text-center text-muted-foreground'>
          {t('browse:noResults')}
        </div>
      ) : null}

      {hasMore && (
        <div ref={loadMoreRef} className='flex flex-col items-center justify-center gap-3 py-10'>
          {isLoading && (
            <>
              <div className='flex items-center gap-2'>
                <span className={'h-2 w-2 rounded-full bg-primary/70 animate-bounce'} />
                <span className={'h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]'} />
                <span className={'h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]'} />
              </div>
              <p className='font-label text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground'>
                {t('browse:catalog.loadingMore')}
              </p>
            </>
          )}

          {!isLoading && <SpinnerLoader />}
        </div>
      )}

      {!hasMore && figures.length > 0 && (
        <div className='py-8 text-center text-muted-foreground'>
          {t('browse:noMoreResults', 'No more figures to load')}
        </div>
      )}
    </section>
  );
};
