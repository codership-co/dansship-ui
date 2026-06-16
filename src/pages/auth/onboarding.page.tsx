import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { OnboardingStudentTrack } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { useOnboarding } from '@hooks';

function OnboardingPage() {
  const { t } = useTranslation();
  const {
    status,
    isLoading,
    isSubmitting,
    error,
    currentStep,
    submitProfileStep,
    submitHealthStep,
    skipHealthStep,
    submitPreferencesStep,
    skipPreferencesStep,
  } = useOnboarding();

  if (isLoading || !status) {
    return <SpinnerLoader />;
  }

  if (!status.required) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>{t('auth:onboarding.notRequired')}</p>
      </div>
    );
  }

  return (
    <div className='min-h-[calc(100vh-4rem)] pt-16'>
      <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 grid gap-8'>
        <div>
          <h3>{t('auth:onboarding.title')}</h3>
          <label>{t('auth:onboarding.subtitle')}</label>
        </div>

        {currentStep?.track === 'student' && (
          <OnboardingStudentTrack
            currentStep={currentStep.step}
            isLoading={isSubmitting}
            error={error}
            submitProfileStep={submitProfileStep}
            submitHealthStep={submitHealthStep}
            skipHealthStep={skipHealthStep}
            submitPreferencesStep={submitPreferencesStep}
            skipPreferencesStep={skipPreferencesStep}
          />
        )}
      </div>
    </div>
  );
}

export const SecureOnboardingPage = SecurityGuard(OnboardingPage, {
  redirect: PageURLS.auth.login,
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isOnboardingPageEnabled],
});
