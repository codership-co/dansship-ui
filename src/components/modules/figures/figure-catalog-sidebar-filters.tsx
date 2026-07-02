import { cva } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { LuCheck, LuSearch, LuX } from 'react-icons/lu';

import { catalogFilterChipVariants } from '@components/modules';
import { Button } from '@components/ui';
import { BrowseFigureFilters } from '@hooks';

const DIFFICULTIES: Array<{ value: BrowseFigureFilters['difficulty']; labelKey: string }> = [
  { value: 'basic', labelKey: 'difficulty:beginner' },
  { value: 'intermediate', labelKey: 'difficulty:intermediate' },
  { value: 'advance', labelKey: 'difficulty:advanced' },
];

const TYPES: Array<{ value: BrowseFigureFilters['type']; labelKey: string }> = [
  { value: 'spins', labelKey: 'figureTypes:spins' },
  { value: 'climbs', labelKey: 'figureTypes:climbs' },
  { value: 'inverts', labelKey: 'figureTypes:inverts' },
  { value: 'flexibility', labelKey: 'figureTypes:flexibility' },
  { value: 'strength', labelKey: 'figureTypes:strength' },
];

export const catalogDesktopCheckboxVariants = cva(
  'flex h-5 w-5 items-center justify-center rounded border text-transparent transition-colors',
  {
    variants: {
      checked: {
        true: 'border-primary bg-primary text-on-primary',
        false: 'border-accent text-transparent',
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

function hasAnyFilter(filters: BrowseFigureFilters) {
  return Boolean(filters.search || filters.difficulty || filters.type || filters.sortBy !== 'name');
}

interface FigureCatalogSidebarFiltersProps {
  filters: BrowseFigureFilters;
  setFilters: React.Dispatch<React.SetStateAction<BrowseFigureFilters>>;
}

export const FigureCatalogSidebarFilters = ({ filters, setFilters }: FigureCatalogSidebarFiltersProps) => {
  const { t } = useTranslation();

  return (
    <aside className='hidden lg:block lg:w-72 lg:shrink-0'>
      <div className='sticky top-28 rounded-xl p-6 shadow-[0_10px_30px_-10px_rgba(88,47,89,0.06)]'>
        <h3 className='font-headline text-lg font-bold tracking-tight text-primary'>
          {t('browse:catalog.filterTitle')}
        </h3>

        <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
          {t('browse:catalog.searchLabelDesktop')}
        </p>
        <div className='relative'>
          <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
            <LuSearch className='h-4 w-4' />
          </span>
          <input
            type='text'
            value={filters.search}
            onChange={event => setFilters(p => ({ ...p, search: event.target.value }))}
            className='w-full rounded-lg border border-transparent bg-secondary-100 px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-surface-container-lowest focus:shadow-sm focus:ring-0'
            placeholder={t('browse:catalog.searchPlaceholderDesktop')}
          />
        </div>

        <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
          {t('browse:filters.difficulty')}
        </p>
        <div className='space-y-1'>
          {DIFFICULTIES.map(option => {
            const checked = filters.difficulty === option.value;

            return (
              <button
                key={option.value}
                type='button'
                className='group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary-100'
                onClick={() =>
                  setFilters(p => ({
                    ...p,
                    difficulty: p.difficulty === option.value ? undefined : option.value,
                  }))
                }
              >
                <span className={catalogDesktopCheckboxVariants({ checked })}>
                  <LuCheck className='h-3.5 w-3.5' />
                </span>
                <span className='text-sm font-medium text-foreground'>{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>

        <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
          {t('browse:filters.type')}
        </p>
        <div className='flex flex-wrap gap-2'>
          {TYPES.map(option => (
            <button
              key={option.value}
              type='button'
              className={catalogFilterChipVariants({ active: filters.type === option.value })}
              onClick={() =>
                setFilters(p => ({
                  ...p,
                  type: p.type === option.value ? undefined : option.value,
                }))
              }
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>

        <div className='mt-6'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              setFilters({
                difficulty: undefined,
                type: undefined,
                search: undefined,
                sortBy: 'name',
              })
            }
            disabled={!hasAnyFilter(filters)}
          >
            <LuX className='h-4 w-4' />
            {t('browse:filters.clear')}
          </Button>
        </div>
      </div>
    </aside>
  );
};
