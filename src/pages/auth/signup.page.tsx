import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SignUpForm, type SignUpFormData } from '@components/forms';
import { Gradients } from '@components/modules';
import { Logotype } from '@components/svg';
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
      <section className='shadow-2xl max-w-100 md:max-w-6xl w-full'>
        <div className='bg-white grid md:grid-cols-[400px_1fr] rounded-xl md:rounded-lg w-full md:h-165 overflow-hidden'>
          <div
            className='pt-20 px-10 pb-8 self-center overflow-auto'
            style={{
              viewTransitionName: 'auth-form',
            }}
          >
            <div className='text-center mb-8'>
              <Logotype className='w-60 md:w-80 m-auto' mainColor='var(--color-tertiary)' />
              <h3>{t('auth:signup.title')}</h3>
              <p className='mt-2 text-gray-600'>{t('auth:signup.subtitle')}</p>
            </div>

            <SignUpForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>

          <Gradients className='hidden md:block' img='/assets/images/auth/dancing-girl.png' flipped />
        </div>
      </section>
    </div>
  );
}

export const SecureSignupPage = SecurityGuard(SignupPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isSignupPageEnabled],
});
