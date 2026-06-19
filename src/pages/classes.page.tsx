import { useTranslation } from 'react-i18next';

import { BookingCalendar } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function ClassesPage() {
  const { t } = useTranslation();

  return (
    <div className='min-h-dvh max-w-6xl mx-auto py-10 px-4'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('classes:title')}</h1>
        <p className='text-gray-500 mt-2'>{t('classes:subtitle')}</p>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        <BookingCalendar />
      </div>
    </div>
  );
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
});
