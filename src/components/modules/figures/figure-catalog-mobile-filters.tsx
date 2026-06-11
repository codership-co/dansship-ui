import { cva } from 'class-variance-authority';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';

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

function hasAnyFilter(filters: BrowseFigureFilters) {
  return Boolean(filters.search || filters.difficulty || filters.type || filters.sortBy !== 'name');
}

export const catalogFilterChipVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
  {
    variants: {
      active: {
        true: 'bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--color-primary-400)]',
        false: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

interface FigureCatalogMobileFiltersProps {
  filters: BrowseFigureFilters;
  setFilters: React.Dispatch<React.SetStateAction<BrowseFigureFilters>>;
}

export const FigureCatalogMobileFilters = ({ filters, setFilters }: FigureCatalogMobileFiltersProps) => {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const activePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.difficulty) {
      const difficulty = DIFFICULTIES.find(item => item.value === filters.difficulty);
      pills.push({
        key: `difficulty-${filters.difficulty}`,
        label: difficulty ? t(difficulty.labelKey) : filters.difficulty,
        onRemove: () =>
          setFilters(p => ({
            ...p,
            difficulty: p.difficulty === filters.difficulty ? undefined : filters.difficulty,
          })),
      });
    }

    if (filters.type) {
      const type = TYPES.find(item => item.value === filters.type);
      pills.push({
        key: `type-${filters.type}`,
        label: type ? t(type.labelKey) : filters.type,
        onRemove: () =>
          setFilters(p => ({
            ...p,
            type: p.type === filters.type ? undefined : filters.type,
          })),
      });
    }

    if (filters.sortBy !== 'name') {
      pills.push({
        key: 'sortBy',
        label: t('browse:catalog.sortOptions.difficulty', { defaultValue: 'Difficulty' }),
        onRemove: () =>
          setFilters(p => ({
            ...p,
            sortBy: 'name',
          })),
      });
    }

    return pills;
  }, [filters.difficulty, filters.sortBy, filters.type, setFilters, t]);

  return (
    <section className='mb-6 space-y-3 lg:hidden'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1'>
          <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
            <LuSearch className='h-4 w-4' />
          </span>
          <input
            type='text'
            value={filters.search}
            onChange={event => setFilters(p => ({ ...p, search: event.target.value }))}
            className='w-full rounded-lg border border-transparent bg-surface-container-low px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-surface-container-lowest focus:shadow-sm focus:ring-0'
            placeholder={t('browse:catalog.searchPlaceholderMobile')}
          />
        </div>

        <Button variant='secondary' className='h-11 min-w-30' onClick={() => setIsPanelOpen(previous => !previous)}>
          <LuSlidersHorizontal className='h-4 w-4' />
          {t('browse:filters.more', { defaultValue: 'Filters' })}
        </Button>
      </div>

      {activePills.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {activePills.map(pill => (
            <button
              key={pill.key}
              type='button'
              className={catalogFilterChipVariants({ active: true })}
              onClick={pill.onRemove}
            >
              {pill.label}
              <LuX className='h-3.5 w-3.5' />
            </button>
          ))}
          <Button
            size='sm'
            variant='ghost'
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
            {t('browse:filters.clear', { defaultValue: 'Clear' })}
          </Button>
        </div>
      ) : null}

      {isPanelOpen ? (
        <div className='rounded-xl border border-outline-variant/45 bg-surface-container-lowest p-4 shadow-sm'>
          <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
            {t('browse:filters.difficulty', { defaultValue: 'Difficulty' })}
          </p>
          <div className='flex flex-wrap gap-2'>
            {DIFFICULTIES.map(option => (
              <button
                key={option.value}
                type='button'
                className={catalogFilterChipVariants({ active: filters.difficulty === option.value })}
                onClick={() =>
                  setFilters(p => ({
                    ...p,
                    difficulty: p.difficulty === option.value ? undefined : option.value,
                  }))
                }
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
            {t('browse:filters.type', { defaultValue: 'Type' })}
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

          <p className='mb-3 mt-6 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
            {t('browse:catalog.sortByLabel', { defaultValue: 'Sort by' })}
          </p>
          <select
            className='rounded-lg border border-outline-variant/60 bg-transparent px-3 py-1.5 text-sm font-medium text-primary outline-none focus:border-primary focus:ring-0'
            value={filters.sortBy}
            onChange={event =>
              setFilters(p => ({
                ...p,
                sortBy: event.target.value as BrowseFigureFilters['sortBy'],
              }))
            }
          >
            <option value='name'>{t('browse:catalog.sortOptions.name', { defaultValue: 'Name A-Z' })}</option>
            <option value='difficulty'>
              {t('browse:catalog.sortOptions.difficulty', { defaultValue: 'Difficulty' })}
            </option>
          </select>
        </div>
      ) : null}
    </section>
  );
};
