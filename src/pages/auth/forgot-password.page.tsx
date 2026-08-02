import { useTranslation } from 'react-i18next';

import { ForgotPasswordForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <AuthFormLayout title={t('auth:forgotPassword.title')} subtitle={t('auth:forgotPassword.subtitle')}>
      <ForgotPasswordForm />
    </AuthFormLayout>
  );
}

export const SecureForgotPasswordPage = SecurityGuard(ForgotPasswordPage, {
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
