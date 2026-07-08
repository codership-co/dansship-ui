import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignUpForm, type SignUpFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

function SignupPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (formData: SignUpFormData) => {
    setIsSubmitting(true);

    await signUp({
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword,
    });
    setIsSubmitting(false);
  };

  return (
    <AuthFormLayout title={t('auth:signup.title')} subtitle={t('auth:signup.subtitle')} isFlipped>
      <SignUpForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </AuthFormLayout>
  );
}

export const SecureSignupPage = SecurityGuard(SignupPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isSignupPageEnabled],
});
