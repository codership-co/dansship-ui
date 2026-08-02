import { useTranslation } from 'react-i18next';

import { LoginForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function LoginPage() {
  const { t } = useTranslation();

  return (
    <AuthFormLayout title={t('auth:login.title')} subtitle={t('auth:login.subtitle')}>
      <LoginForm />
    </AuthFormLayout>
  );
}

export const SecureLoginPage = SecurityGuard(LoginPage, {
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
