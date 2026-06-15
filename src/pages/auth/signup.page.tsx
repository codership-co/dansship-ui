import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SignUpForm, type SignUpFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);

    const response = await signUp({
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    });
    setIsSubmitting(false);

    if (response.status === 200) {
      navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}&pending=1`);
    } else {
      // eslint-disable-next-line no-console
      console.error('Registration failed:', response.error);
    }
  };

  return (
    <AuthFormLayout
      gradientsImage='/assets/images/auth/dancing-girl.png'
      title={t('auth:signup.title')}
      subtitle={t('auth:signup.subtitle')}
      isFlipped
    >
      <SignUpForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </AuthFormLayout>
  );
}

export const SecureSignupPage = SecurityGuard(SignupPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isSignupPageEnabled],
});
