import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { CompletedFiguresList, CompletedStats } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { useFigures } from '@hooks';

function FigureCompletedPage() {
  const { t } = useTranslation();
  const { figures, isLoading } = useFigures();

  const completedFigures = figures.filter(figure => figure.status === 'completed');

  if (isLoading) {
    return <SpinnerLoader message={t('common:loading')} />;
  }

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>{t('completedFigures:title')}</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          <CompletedFiguresList figures={completedFigures} />
        </div>

        <div className='lg:col-span-1'>
          <CompletedStats figures={completedFigures} />
        </div>
      </div>
    </main>
  );
}

export const SecureFigureCompletedPage = SecurityGuard(FigureCompletedPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isFigureCompletedPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
