import { useCallback, useEffect, useState } from 'react';

import {
  CompleteCertificationsStepPayload,
  CompleteOperationalProfileStepPayload,
  DayOfWeek,
  OnboardingStepKey,
  OnboardingTrackKey,
} from '@core/api';
import { useOnboarding } from '@hooks';

const OPERATIONAL_PROFILE_DRAFT_KEY = 'instructor_operational_profile_draft';

const readOperationalProfileDraft = (): CompleteOperationalProfileStepPayload['payload'] => {
  const defaultOperationalProfile: CompleteOperationalProfileStepPayload['payload'] = {
    instagram: '',
    availability: [{ day_of_week: 'monday' as DayOfWeek, start_time: '09:00', end_time: '12:00' }],
    disciplines: [{ discipline_name: '', years_experience: 1 }],
  };

  try {
    const raw = sessionStorage.getItem(OPERATIONAL_PROFILE_DRAFT_KEY);

    return raw ? (JSON.parse(raw) as CompleteOperationalProfileStepPayload['payload']) : defaultOperationalProfile;
  } catch {
    return defaultOperationalProfile;
  }
};

const writeOperationalProfileDraft = (payload: CompleteOperationalProfileStepPayload['payload']) => {
  sessionStorage.setItem(OPERATIONAL_PROFILE_DRAFT_KEY, JSON.stringify(payload));
};

const clearOperationalProfileDraft = () => {
  sessionStorage.removeItem(OPERATIONAL_PROFILE_DRAFT_KEY);
};

export const useInstructorOnboarding = () => {
  const { currentStep, visitedSteps, setMemoryRouter, submitStep, isSubmittingStep, error } = useOnboarding();

  const [operationalProfileDraft, setOperationalProfileDraft] = useState<
    CompleteOperationalProfileStepPayload['payload']
  >(() => readOperationalProfileDraft());

  const canNavigateToStep = useCallback(
    (step: OnboardingStepKey) => {
      return visitedSteps.has(`${OnboardingTrackKey.INSTRUCTOR}:${step}`);
    },
    [visitedSteps],
  );

  const goToStep = useCallback(
    (step: OnboardingStepKey) => {
      if (!canNavigateToStep(step)) return;

      setMemoryRouter(prev => ({
        ...prev,
        currentStep: {
          track: OnboardingTrackKey.INSTRUCTOR,
          step,
        },
      }));
    },
    [canNavigateToStep, setMemoryRouter],
  );

  const submitOperationalProfileStep = useCallback(
    (payload: CompleteOperationalProfileStepPayload['payload']) => {
      try {
        void submitStep({
          track: OnboardingTrackKey.INSTRUCTOR,
          stepKey: OnboardingStepKey.OPERATIONAL_PROFILE,
          payload,
        }).then(() => {
          writeOperationalProfileDraft(payload);
          setOperationalProfileDraft(payload);
        });
      } catch {}
    },
    [submitStep],
  );

  const submitCertificationsStep = useCallback(
    (payload: CompleteCertificationsStepPayload['payload']) => {
      void submitStep({
        track: OnboardingTrackKey.INSTRUCTOR,
        stepKey: OnboardingStepKey.CERTIFICATIONS,
        payload,
      });
    },
    [submitStep],
  );

  const skipCertificationsStep = useCallback(() => {
    void submitStep({
      track: OnboardingTrackKey.INSTRUCTOR,
      stepKey: OnboardingStepKey.CERTIFICATIONS,
      payload: {
        documents: [],
      },
    });
  }, [submitStep]);

  useEffect(() => {
    if (!currentStep?.step) {
      clearOperationalProfileDraft();
    }
  }, [currentStep?.step]);

  return {
    currentStep,
    isSubmittingStep,
    error,
    operationalProfileDraft,
    canNavigateToStep,
    goToStep,
    submitOperationalProfileStep,
    submitCertificationsStep,
    skipCertificationsStep,
  };
};
