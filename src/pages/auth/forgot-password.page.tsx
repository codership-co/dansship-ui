import { useTranslation } from 'react-i18next';

import { ForgotPasswordForm } from '@components/forms';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h3>{t('auth:forgotPassword.title')}</h3>
          <p className='mt-2 text-gray-600'>{t('auth:forgotPassword.subtitle')}</p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-8'>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
