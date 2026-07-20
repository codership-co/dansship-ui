import { useTranslation } from 'react-i18next';

import { ForgotPasswordForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <AuthFormLayout title={t('auth:forgotPassword.title')} subtitle={t('auth:forgotPassword.subtitle')}>
      <ForgotPasswordForm />
    </AuthFormLayout>
  );
}

export const SecureForgotPasswordPage = SecurityGuard(ForgotPasswordPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
