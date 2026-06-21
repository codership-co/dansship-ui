import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ForgotPasswordForm, ForgotPasswordFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await forgotPassword({
        email: data.email,
      });
      setEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title={t('auth:forgotPassword.title')}
      subtitle={
        isSubmitted ? (
          <Trans
            i18nKey='auth:forgotPassword.instructions'
            components={{
              email: (
                <>
                  <br />
                  <span className='font-medium'>{email}</span>
                </>
              ),
            }}
          />
        ) : (
          t('auth:forgotPassword.subtitle')
        )
      }
    >
      <ForgotPasswordForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </AuthFormLayout>
  );
}

export const SecureForgotPasswordPage = SecurityGuard(ForgotPasswordPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isForgotPasswordPageEnabled],
});
