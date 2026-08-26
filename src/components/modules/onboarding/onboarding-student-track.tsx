import { useTranslation } from 'react-i18next';
import { IoHeartCircleOutline, IoListCircleOutline } from 'react-icons/io5';
import { PiUserCircle } from 'react-icons/pi';

import { SectionHeading } from '@components/containers';
import { HealthProfileForm, PreferencesProfileForm, BasicProfileForm } from '@components/forms';
import { FormStepperLayout } from '@components/layouts';
import { ProfileDataKey } from '@core/api';
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
            step: ProfileDataKey.PROFILE,
            Icon: PiUserCircle,
            form: (
              <BasicProfileForm
                requireTermsAcceptance
                isLoading={isSubmittingStep}
                error={error}
                onSubmit={data =>
                  submitProfileStep({
                    ...data,
                    birth_date: data.birth_date.toISOString().slice(0, 10),
                    terms_accepted: true,
                  })
                }
              />
            ),
          },
          {
            title: t('auth:onboarding.steps.second.title'),
            subtitle: t('auth:onboarding.steps.second.subtitle'),
            step: ProfileDataKey.HEALTH,
            Icon: IoHeartCircleOutline,
            form: (
              <HealthProfileForm
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
            step: ProfileDataKey.PREFERENCES,
            Icon: IoListCircleOutline,
            form: (
              <PreferencesProfileForm
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
