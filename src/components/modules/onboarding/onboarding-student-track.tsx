import { useTranslation } from 'react-i18next';
import { IoHeartCircleOutline, IoListCircleOutline } from 'react-icons/io5';
import { PiUserCircle } from 'react-icons/pi';

import {
  OnboardingHealthForm,
  OnboardingStudentPreferencesForm,
  OnboardingStudentProfileForm,
} from '@components/forms';
import { FormStepperLayout } from '@components/layouts';
import { OnboardingStepKey, OnboardingTrackKey } from '@core/api';
import { useOnboarding } from '@hooks';

interface OnboardingStudentTrackProps {
  currentStep: OnboardingStepKey;
  isLoading: boolean;
  error: string | null;
  submitProfileStep: ReturnType<typeof useOnboarding>['submitProfileStep'];
  submitHealthStep: ReturnType<typeof useOnboarding>['submitHealthStep'];
  skipHealthStep: ReturnType<typeof useOnboarding>['skipHealthStep'];
  submitPreferencesStep: ReturnType<typeof useOnboarding>['submitPreferencesStep'];
  skipPreferencesStep: ReturnType<typeof useOnboarding>['skipPreferencesStep'];
}

export const OnboardingStudentTrack = ({
  currentStep,
  isLoading,
  error,
  submitProfileStep,
  submitHealthStep,
  skipHealthStep,
  submitPreferencesStep,
  skipPreferencesStep,
}: OnboardingStudentTrackProps) => {
  const { t } = useTranslation();

  return (
    <FormStepperLayout
      currentStep={currentStep}
      noAvailableStepMessage={t('auth:onboarding.noStepAvailable')}
      steps={[
        {
          title: t('auth:onboarding.steps.first.title'),
          subtitle: t('auth:onboarding.steps.first.subtitle'),
          step: OnboardingStepKey.PROFILE,
          Icon: PiUserCircle,
          form: (
            <OnboardingStudentProfileForm
              isLoading={isLoading}
              error={error}
              onSubmit={data =>
                submitProfileStep({
                  track: OnboardingTrackKey.STUDENT,
                  payload: { ...data, birth_date: data.birth_date.toISOString().slice(0, 10) },
                })
              }
            />
          ),
        },
        {
          title: t('auth:onboarding.steps.second.title'),
          subtitle: t('auth:onboarding.steps.second.subtitle'),
          step: OnboardingStepKey.HEALTH,
          Icon: IoHeartCircleOutline,
          form: (
            <OnboardingHealthForm
              isLoading={isLoading}
              error={error}
              onContinue={data => submitHealthStep({ track: OnboardingTrackKey.STUDENT, payload: data })}
              onSkip={() => skipHealthStep({ track: OnboardingTrackKey.STUDENT })}
            />
          ),
        },
        {
          title: t('auth:onboarding.steps.third.title'),
          subtitle: t('auth:onboarding.steps.third.subtitle'),
          step: OnboardingStepKey.PREFERENCES,
          Icon: IoListCircleOutline,
          form: (
            <OnboardingStudentPreferencesForm
              isLoading={isLoading}
              error={error}
              onComplete={data => submitPreferencesStep({ track: OnboardingTrackKey.STUDENT, payload: data })}
              onSkip={() => skipPreferencesStep({ track: OnboardingTrackKey.STUDENT })}
            />
          ),
        },
      ]}
    />
  );
};
