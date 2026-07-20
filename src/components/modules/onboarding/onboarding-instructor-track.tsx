import { useTranslation } from 'react-i18next';
import { IoRibbonOutline } from 'react-icons/io5';
import { PiCalendarCheck } from 'react-icons/pi';

import { SectionHeading } from '@components/containers';
import { CertificationsProfileForm, OperationalProfileForm } from '@components/forms';
import { FormStepperLayout } from '@components/layouts';
import { ProfileDataKey } from '@core/api';
import { useInstructorOnboarding } from '@hooks';

export const OnboardingInstructorTrack = () => {
  const { t } = useTranslation();
  const {
    isSubmittingStep,
    error,
    currentStep,
    operationalProfileDraft,
    canNavigateToStep,
    goToStep,
    submitOperationalProfileStep,
    submitCertificationsStep,
    skipCertificationsStep,
  } = useInstructorOnboarding();

  if (!currentStep) {
    return null;
  }

  return (
    <>
      <SectionHeading title={t('auth:onboarding.instructorTitle')} subtitle={t('auth:onboarding.instructorSubtitle')} />
      <FormStepperLayout
        currentStep={currentStep.step}
        noAvailableStepMessage={t('auth:onboarding.noStepAvailable')}
        canNavigateToStep={canNavigateToStep}
        onStepSelect={goToStep}
        steps={[
          {
            title: t('auth:onboarding.instructorSteps.first.title'),
            subtitle: t('auth:onboarding.instructorSteps.first.subtitle'),
            step: ProfileDataKey.OPERATIONAL_PROFILE,
            Icon: PiCalendarCheck,
            form: (
              <OperationalProfileForm
                isLoading={isSubmittingStep}
                error={error}
                defaultValues={operationalProfileDraft}
                onSubmit={submitOperationalProfileStep}
              />
            ),
          },
          {
            title: t('auth:onboarding.instructorSteps.second.title'),
            subtitle: t('auth:onboarding.instructorSteps.second.subtitle'),
            step: ProfileDataKey.CERTIFICATIONS,
            Icon: IoRibbonOutline,
            form: (
              <CertificationsProfileForm
                isLoading={isSubmittingStep}
                error={error}
                onComplete={documents => submitCertificationsStep({ documents })}
                onSkip={skipCertificationsStep}
                onBack={() => goToStep(ProfileDataKey.OPERATIONAL_PROFILE)}
              />
            ),
          },
        ]}
      />
    </>
  );
};
