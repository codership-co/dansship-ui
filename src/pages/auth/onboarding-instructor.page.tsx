import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { OnboardingInstructorTrack } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { OnboardingTrackKey } from '@core/api';
import { PageURLS } from '@core/constants';
import { useOnboarding } from '@hooks';

function OnboardingInstructorPage() {
  const { t } = useTranslation();
  const {
    status,
    isLoading,
    isSubmitting,
    error,
    currentStep,
    operationalProfileDraft,
    canNavigateToStep,
    goToStep,
    submitOperationalProfileStep,
    submitCertificationsStep,
    skipCertificationsStep,
  } = useOnboarding({ preferredTrack: OnboardingTrackKey.INSTRUCTOR });

  if (isLoading || !status) {
    return <SpinnerLoader />;
  }

  if (!status.required || currentStep?.track !== OnboardingTrackKey.INSTRUCTOR) {
    return (
      <div className='min-h-dvh flex items-center justify-center'>
        <p>{t('auth:onboarding.notRequired')}</p>
      </div>
    );
  }

  return (
    <div className='min-h-[calc(100vh-4rem)] pt-16'>
      <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 grid gap-8'>
        <div>
          <h3>{t('auth:onboarding.instructorTitle')}</h3>
          <label>{t('auth:onboarding.instructorSubtitle')}</label>
        </div>

        <OnboardingInstructorTrack
          currentStep={currentStep.step}
          isLoading={isSubmitting}
          error={error}
          operationalProfileDraft={operationalProfileDraft}
          canNavigateToStep={canNavigateToStep}
          goToStep={goToStep}
          submitOperationalProfileStep={submitOperationalProfileStep}
          submitCertificationsStep={submitCertificationsStep}
          skipCertificationsStep={skipCertificationsStep}
        />
      </div>
    </div>
  );
}

export const SecureOnboardingInstructorPage = SecurityGuard(OnboardingInstructorPage, {
  redirect: PageURLS.auth.login,
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isOnboardingPageEnabled],
});
