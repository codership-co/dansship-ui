import { cva } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Figure } from '@core/api';
import { PageURLS } from '@core/constants';
import { mapDifficultyToDisplay } from '@helpers';

interface FigureCatalogCardProps {
  figure: Figure;
}

export const catalogCardDifficultyBadgeVariants = cva(
  'rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
  {
    variants: {
      level: {
        basic: 'bg-[hsl(var(--surface-container-highest)/0.9)] text-primary',
        intermediate: 'bg-[hsl(var(--secondary-container)/0.9)] text-secondary',
        'intermediate-advance': 'bg-[hsl(var(--tertiary-container)/0.9)] text-[hsl(var(--on-tertiary-container))]',
        advance: 'bg-[hsl(var(--error)/0.9)] text-[hsl(var(--on-error))]',
      },
    },
    defaultVariants: {
      level: 'basic',
    },
  },
);

export const FigureCatalogCard = ({ figure }: FigureCatalogCardProps) => {
  const { t } = useTranslation();

  const imageUrl = figure.image_url || figure.image || '';
  const difficultyLevel = figure.difficulty as 'basic' | 'intermediate' | 'intermediate-advance' | 'advance';
  const displayDifficulty = mapDifficultyToDisplay(figure.difficulty);
  const description = figure.description?.trim() ? figure.description : t('browse.catalog.cardDescriptionFallback');

  return (
    <Link to={PageURLS.figuresById(figure.id)} className='block h-full'>
      <article className='group flex h-full flex-col overflow-hidden rounded-xl border border-[hsl(var(--outline-variant)/0.2)] bg-[hsl(var(--surface-container-lowest))] shadow-[0_8px_30px_-12px_rgba(88,47,89,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(88,47,89,0.16)]'>
        <div className='relative aspect-4/5 overflow-hidden bg-[hsl(var(--surface-container-low))]'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={figure.name}
              className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
              loading='lazy'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-[hsl(var(--surface-container))] p-4 text-center text-sm font-semibold text-muted-foreground'>
              {figure.name}
            </div>
          )}

          <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent' />

          <div className='absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2'>
            <span className={catalogCardDifficultyBadgeVariants({ level: difficultyLevel })}>
              {t(`difficulty:${displayDifficulty.toLowerCase()}`)}
            </span>
            <span className='rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-white/95'>
              {t(`figureTypes.${figure.type.toLowerCase()}`)}
            </span>
          </div>
        </div>

        <div className='flex flex-1 flex-col gap-1 p-4'>
          <h3 className='font-headline text-xl font-bold tracking-tight text-primary'>{figure.name}</h3>
          <p className='line-clamp-2 text-sm leading-relaxed text-muted-foreground'>{description}</p>
        </div>
      </article>
    </Link>
  );
};
