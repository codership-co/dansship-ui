import { useTranslation } from 'react-i18next';
import { IoRibbonOutline } from 'react-icons/io5';
import { PiCalendarCheck } from 'react-icons/pi';

import { OnboardingInstructorCertificationsForm, OnboardingInstructorOperationalProfileForm } from '@components/forms';
import { FormStepperLayout } from '@components/layouts';
import { OnboardingStepKey, OnboardingTrackKey } from '@core/api';
import { useOnboarding } from '@hooks';

interface OnboardingInstructorTrackProps {
  currentStep: OnboardingStepKey;
  isLoading: boolean;
  error: string | null;
  operationalProfileDraft: ReturnType<typeof useOnboarding>['operationalProfileDraft'];
  canNavigateToStep: ReturnType<typeof useOnboarding>['canNavigateToStep'];
  goToStep: ReturnType<typeof useOnboarding>['goToStep'];
  submitOperationalProfileStep: ReturnType<typeof useOnboarding>['submitOperationalProfileStep'];
  submitCertificationsStep: ReturnType<typeof useOnboarding>['submitCertificationsStep'];
  skipCertificationsStep: ReturnType<typeof useOnboarding>['skipCertificationsStep'];
}

export const OnboardingInstructorTrack = ({
  currentStep,
  isLoading,
  error,
  operationalProfileDraft,
  canNavigateToStep,
  goToStep,
  submitOperationalProfileStep,
  submitCertificationsStep,
  skipCertificationsStep,
}: OnboardingInstructorTrackProps) => {
  const { t } = useTranslation();

  return (
    <FormStepperLayout
      currentStep={currentStep}
      noAvailableStepMessage={t('auth:onboarding.noStepAvailable')}
      canNavigateToStep={canNavigateToStep}
      onStepSelect={goToStep}
      onBack={
        currentStep === OnboardingStepKey.CERTIFICATIONS && canNavigateToStep(OnboardingStepKey.OPERATIONAL_PROFILE)
          ? () => goToStep(OnboardingStepKey.OPERATIONAL_PROFILE)
          : undefined
      }
      steps={[
        {
          title: t('auth:onboarding.instructorSteps.first.title'),
          subtitle: t('auth:onboarding.instructorSteps.first.subtitle'),
          step: OnboardingStepKey.OPERATIONAL_PROFILE,
          Icon: PiCalendarCheck,
          form: (
            <OnboardingInstructorOperationalProfileForm
              isLoading={isLoading}
              error={error}
              defaultValues={operationalProfileDraft}
              onSubmit={data =>
                submitOperationalProfileStep({
                  track: OnboardingTrackKey.INSTRUCTOR,
                  payload: data,
                })
              }
            />
          ),
        },
        {
          title: t('auth:onboarding.instructorSteps.second.title'),
          subtitle: t('auth:onboarding.instructorSteps.second.subtitle'),
          step: OnboardingStepKey.CERTIFICATIONS,
          Icon: IoRibbonOutline,
          form: (
            <OnboardingInstructorCertificationsForm
              isLoading={isLoading}
              error={error}
              onComplete={documents =>
                submitCertificationsStep({
                  track: OnboardingTrackKey.INSTRUCTOR,
                  payload: { documents },
                })
              }
              onSkip={() => skipCertificationsStep({ track: OnboardingTrackKey.INSTRUCTOR })}
            />
          ),
        },
      ]}
    />
  );
};
