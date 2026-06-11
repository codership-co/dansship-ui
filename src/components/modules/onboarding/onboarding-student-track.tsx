import { useTranslation } from 'react-i18next';

import {
  OnboardingHealthForm,
  OnboardingStudentPreferencesForm,
  OnboardingStudentProfileForm,
} from '@components/forms';
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

  if (currentStep === OnboardingStepKey.PROFILE) {
    return (
      <OnboardingStudentProfileForm
        isLoading={isLoading}
        error={error}
        onSubmit={data =>
          submitProfileStep({
            track: OnboardingTrackKey.STUDENT,
            payload: {
              full_name: data.fullName.trim(),
              birth_date: data.birthDate ? data.birthDate.toISOString().slice(0, 10) : undefined,
              phone_country_code: data.phoneCountryCode?.trim() || undefined,
              phone_number: data.phoneNumber?.trim() || undefined,
              document_type: data.documentType?.trim() || undefined,
              document_value: data.documentValue?.trim() || undefined,
              city: data.city?.trim() || undefined,
              address: data.address?.trim() || undefined,
            },
          })
        }
      />
    );
  }

  if (currentStep === OnboardingStepKey.HEALTH) {
    return (
      <OnboardingHealthForm
        isLoading={isLoading}
        error={error}
        onContinue={data =>
          submitHealthStep({
            track: OnboardingTrackKey.STUDENT,
            payload: {
              emergency_contact_name: data.emergencyContactName?.trim(),
              emergency_contact_relative: data.emergencyContactRelative?.trim(),
              emergency_contact_phone_country_code: data.emergencyContactPhoneCountryCode?.trim(),
              emergency_contact_phone_number: data.emergencyContactPhoneNumber?.trim(),
              eps: data.eps?.trim(),
              existing_medical_conditions: data.existingMedicalConditions?.trim(),
            },
          })
        }
        onSkip={() => skipHealthStep({ track: OnboardingTrackKey.STUDENT })}
      />
    );
  }

  if (currentStep === 'student_preferences') {
    return (
      <OnboardingStudentPreferencesForm
        isLoading={isLoading}
        error={error}
        onComplete={data =>
          submitPreferencesStep({
            track: OnboardingTrackKey.STUDENT,
            payload: {
              heard_about_us: data.heardAboutUs,
              goals: data.goals,
              disciplines: data.disciplines,
              current_level: data.currentLevel,
              preferred_schedules: data.preferredSchedules,
            },
          })
        }
        onSkip={() => skipPreferencesStep({ track: OnboardingTrackKey.STUDENT })}
      />
    );
  }

  return <p className='text-sm text-gray-600'>{t('auth:onboarding.noStepAvailable')}</p>;
};
