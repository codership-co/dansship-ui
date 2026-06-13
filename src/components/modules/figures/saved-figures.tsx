import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { type Figure } from '@core/api';
import { PageURLS } from '@core/constants';
import { getDifficultyColor, getRelativeTime, mapDifficultyToDisplay } from '@helpers';

interface SavedFiguresProps {
  figures: Array<Figure>;
}

export function SavedFigures({ figures }: SavedFiguresProps) {
  const { t, i18n } = useTranslation();

  // Show only the first 3 saved figures in the profile sidebar
  const displayFigures = figures.slice(0, 3);

  if (displayFigures.length === 0) {
    return (
      <div className='text-center py-4'>
        <p className='text-sm text-gray-500'>{t('savedFigures:noFigures')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {displayFigures.map(figure => {
        if (!figure.id) {
          return null;
        }

        return (
          <Link
            key={figure.id}
            to={PageURLS.figuresById(figure.id)}
            className='flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors'
          >
            <img
              src={figure.image || figure.image_url || 'https://placehold.co/400x400?text=No+Image'}
              alt={figure.name}
              className='w-16 h-16 rounded-lg object-cover'
            />
            <div className='grow'>
              <h3 className='font-medium text-gray-900'>{figure.name}</h3>
              <p className='text-sm text-gray-500'>
                {figure.savedAt
                  ? getRelativeTime(figure.savedAt, i18n.language)
                  : t('savedFigures:savedTime', { time: 'recently' })}
              </p>
            </div>
            {figure.difficulty && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(figure.difficulty)}`}>
                {t(`difficulty:${mapDifficultyToDisplay(figure.difficulty).toLowerCase()}`)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
