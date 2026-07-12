import { useTranslation } from 'react-i18next';

import { SignUpForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

function SignupPage() {
  const { t } = useTranslation();

  return (
    <AuthFormLayout title={t('auth:signup.title')} subtitle={t('auth:signup.subtitle')} isFlipped>
      <SignUpForm />
    </AuthFormLayout>
  );
}

export const SecureSignupPage = SecurityGuard(SignupPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isSignupPageEnabled],
});
