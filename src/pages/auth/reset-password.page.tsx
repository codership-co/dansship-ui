import { Trans, useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { ResetPasswordForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const email: string = state?.email ?? '';

  return (
    <AuthFormLayout
      title={t('auth:resetPassword.title')}
      subtitle={
        <Trans
          i18nKey='auth:resetPassword.subtitle'
          components={{
            email: <span className='font-medium underline'>{email}</span>,
          }}
        />
      }
    >
      <ResetPasswordForm />
    </AuthFormLayout>
  );
}

export const SecureResetPasswordPage = SecurityGuard(ResetPasswordPage, {
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
