import { useTranslation } from 'react-i18next';
import { IoHeartCircleOutline, IoListCircleOutline } from 'react-icons/io5';
import { PiUserCircle } from 'react-icons/pi';

import { SectionHeading } from '@components/containers';
import {
  OnboardingHealthForm,
  OnboardingStudentPreferencesForm,
  OnboardingStudentProfileForm,
} from '@components/forms';
import { FormStepperLayout } from '@components/layouts';
import { OnboardingStepKey } from '@core/api';
import { useStudentOnboarding } from '@hooks';

export const OnboardingStudentTrack = () => {
  const { t } = useTranslation();
  const {
    currentStep,
    isSubmittingStep,
    submitProfileStep,
    submitHealthStep,
    skipHealthStep,
    submitPreferencesStep,
    skipPreferencesStep,
    error,
  } = useStudentOnboarding();

  if (!currentStep) {
    return null;
  }

  return (
    <>
      <SectionHeading title={t('auth:onboarding.title')} subtitle={t('auth:onboarding.subtitle')} />
      <FormStepperLayout
        currentStep={currentStep.step}
        noAvailableStepMessage={t('auth:onboarding.noStepAvailable')}
        steps={[
          {
            title: t('auth:onboarding.steps.first.title'),
            subtitle: t('auth:onboarding.steps.first.subtitle'),
            step: OnboardingStepKey.PROFILE,
            Icon: PiUserCircle,
            form: (
              <OnboardingStudentProfileForm
                isLoading={isSubmittingStep}
                error={error}
                onSubmit={data =>
                  submitProfileStep({
                    ...data,
                    birth_date: data.birth_date.toISOString().slice(0, 10),
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
                isLoading={isSubmittingStep}
                error={error}
                onContinue={submitHealthStep}
                onSkip={skipHealthStep}
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
                isLoading={isSubmittingStep}
                error={error}
                onComplete={submitPreferencesStep}
                onSkip={skipPreferencesStep}
              />
            ),
          },
        ]}
      />
    </>
  );
};
