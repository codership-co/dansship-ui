import { useTranslation } from 'react-i18next';
import { LuBookmark } from 'react-icons/lu';
import { Link } from 'react-router';

import { Figure } from '@core/api';
import { PageURLS } from '@core/constants';
import { getDifficultyColor, mapDifficultyToDisplay, getRelativeTime } from '@helpers';

interface SavedFiguresListProps {
  figures: Array<Figure>;
}

export function SavedFiguresList({ figures }: SavedFiguresListProps) {
  const { t, i18n } = useTranslation();

  if (figures.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm p-6 text-center'>
        <p className='text-gray-500'>{t('savedFigures:noFigures')}</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='space-y-4'>
        {figures.map(figure => {
          if (!figure.id) {
            return null;
          }

          return (
            <Link
              key={figure.id}
              to={PageURLS.figuresById(figure.id)}
              className='block border rounded-lg p-4 hover:border-purple-200 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <img
                  src={figure.image || figure.image_url || 'https://placehold.co/400x400?text=No+Image'}
                  alt={figure.name}
                  className='w-20 h-20 rounded-lg object-cover'
                />
                <div className='grow'>
                  <h3 className='font-medium text-gray-900'>{figure.name}</h3>
                  <div className='flex flex-wrap gap-2 mt-1'>
                    {figure.difficulty && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(figure.difficulty)}`}
                      >
                        {t(`difficulty:${mapDifficultyToDisplay(figure.difficulty).toLowerCase()}`)}
                      </span>
                    )}
                    {figure.type && (
                      <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                        {t(`figureTypes:${figure.type.toLowerCase()}`)}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-1 mt-2 text-sm text-gray-500'>
                    <LuBookmark className='w-4 h-4' />
                    <span>
                      {t('savedFigures:savedTime', {
                        time: getRelativeTime(figure.savedAt || new Date(), i18n.language),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
