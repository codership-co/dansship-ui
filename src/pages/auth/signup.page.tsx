import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SignUpForm, type SignUpFormData } from '@components/forms';
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
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h3>{t('auth:signup.title')}</h3>
          <p className='mt-2 text-gray-600'>{t('auth:signup.subtitle')}</p>
        </div>

        <SignUpForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}

export const SecureSignupPage = SecurityGuard(SignupPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isSignupPageEnabled],
});
