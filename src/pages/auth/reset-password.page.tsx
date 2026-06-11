import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ResetPasswordForm } from '@components/forms';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

import type { ResetPasswordPayload } from '@core/api';

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async ({ email, new_password, code }: ResetPasswordPayload) => {
    setIsSubmitting(true);

    try {
      await resetPassword({ email, new_password, code });
      navigate('/auth/login');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Reset password failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h3>{t('auth:resetPassword.title')}</h3>
          <p className='mt-2 text-gray-600'>{t('auth:resetPassword.subtitle')}</p>
        </div>

        <ResetPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}

export const SecureResetPasswordPage = SecurityGuard(ResetPasswordPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isResetPasswordPageEnabled],
});
