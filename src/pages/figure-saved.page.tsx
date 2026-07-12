import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { SavedFiguresList, SavedStats } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function FigureSavedPage() {
  const { t } = useTranslation();
  const { response: savedFigures, isLoading } = usePromise(() => DansshipAPI.figures.getSavedFigures());

  if (isLoading) {
    return <SpinnerLoader message={t('common:loading')} />;
  }

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20'>
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>{t('savedFigures:title')}</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          <SavedFiguresList figures={savedFigures?.data ?? []} />
        </div>

        <div className='lg:col-span-1'>
          <SavedStats figures={savedFigures?.data ?? []} />
        </div>
      </div>
    </main>
  );
}

export const SecureFigureSavedPage = SecurityGuard(FigureSavedPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isFigureSavedPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
