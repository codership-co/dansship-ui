import { useTranslation } from 'react-i18next';

import { Figure, DifficultyType } from '@core/api';
import { mapDifficultyToDisplay } from '@helpers';

interface SavedStatsProps {
  figures: Array<Figure>;
}

export function SavedStats({ figures }: SavedStatsProps) {
  const { t } = useTranslation();

  const totalSaved = figures.length;
  const byDifficulty = figures.reduce(
    (acc, figure) => ({
      ...acc,
      [figure.difficulty]: (acc[figure.difficulty] || 0) + 1,
    }),
    {} as Record<string, number>,
  );

  const byType = figures.reduce(
    (acc, figure) => ({
      ...acc,
      [figure.type]: (acc[figure.type] || 0) + 1,
    }),
    {} as Record<string, number>,
  );

  return (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h2 className='text-xl font-bold text-gray-900 mb-6'>{t('savedFigures:stats.title')}</h2>

      <div className='space-y-6'>
        <div>
          <div className='text-3xl font-bold text-purple-600'>{totalSaved}</div>
          <div className='text-sm text-gray-500'>{t('savedFigures:stats.total')}</div>
        </div>

        <div>
          <h3 className='text-sm font-medium text-gray-700 mb-2'>{t('savedFigures:stats.byDifficulty')}</h3>
          <div className='space-y-2'>
            {Object.entries(byDifficulty).map(([difficulty, count]) => (
              <div key={difficulty} className='flex justify-between items-center'>
                <span className='text-gray-600'>
                  {t(`difficulty:${mapDifficultyToDisplay(difficulty as DifficultyType).toLowerCase()}`)}
                </span>
                <span className='font-medium'>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className='text-sm font-medium text-gray-700 mb-2'>{t('savedFigures:stats.byType')}</h3>
          <div className='space-y-2'>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className='flex justify-between items-center'>
                <span className='text-gray-600'>{t(`figureTypes:${type.toLowerCase()}`)}</span>
                <span className='font-medium'>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
