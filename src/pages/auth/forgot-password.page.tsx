import { useTranslation } from 'react-i18next';

import { ForgotPasswordForm } from '@components/forms';
import { Gradients } from '@components/modules';
import { Logotype } from '@components/svg';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <section className='shadow-2xl max-w-100 md:max-w-6xl w-full'>
        <div className='bg-white grid md:grid-cols-[1fr_400px] rounded-xl md:rounded-lg w-full md:h-165 overflow-hidden'>
          <Gradients className='hidden md:block' img='/assets/images/auth/dancing-girl-2.png' />

          <section
            className='pt-20 px-10 pb-8 self-center overflow-auto'
            style={{
              viewTransitionName: 'auth-form',
            }}
          >
            <div className='text-center mb-8'>
              <Logotype className='w-60 md:w-80 m-auto' />
              <h3>{t('auth:forgotPassword.title')}</h3>
              <p className='mt-2 text-gray-600'>{t('auth:forgotPassword.subtitle')}</p>
            </div>

            <ForgotPasswordForm />
          </section>
        </div>
      </section>
    </div>
  );
}

export const SecureForgotPasswordPage = SecurityGuard(ForgotPasswordPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isForgotPasswordPageEnabled],
});
