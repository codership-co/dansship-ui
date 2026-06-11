import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { OnboardingStudentTrack } from '@components/modules/onboarding';
import { useOnboarding } from '@hooks';

export function OnboardingPage() {
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
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl w-full bg-white rounded-lg shadow-sm p-8 space-y-6'>
        <div>
          <h3>{t('auth:onboarding.title')}</h3>
          <p className='text-gray-600 mt-2'>{t('auth:onboarding.subtitle')}</p>
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
