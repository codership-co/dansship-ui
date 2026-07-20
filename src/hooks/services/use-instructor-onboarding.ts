import { useCallback, useEffect, useState } from 'react';

import {
  CertificationsProfilePayload,
  DaysOfWeek,
  OperationalProfilePayload,
  ProfileDataKey,
  ProfileTrackKey,
} from '@core/api';
import { useOnboarding } from '@hooks';

const OPERATIONAL_PROFILE_DRAFT_KEY = 'instructor_operational_profile_draft';

const readOperationalProfileDraft = (): OperationalProfilePayload => {
  const defaultOperationalProfile: OperationalProfilePayload = {
    instagram: '',
    availability: [{ day_of_week: DaysOfWeek.MONDAY, start_time: '09:00', end_time: '12:00' }],
    disciplines: [{ discipline_name: '', years_experience: 1 }],
  };

  try {
    const raw = sessionStorage.getItem(OPERATIONAL_PROFILE_DRAFT_KEY);

    return raw ? (JSON.parse(raw) as OperationalProfilePayload) : defaultOperationalProfile;
  } catch {
    return defaultOperationalProfile;
  }
};

const writeOperationalProfileDraft = (payload: OperationalProfilePayload) => {
  sessionStorage.setItem(OPERATIONAL_PROFILE_DRAFT_KEY, JSON.stringify(payload));
};

const clearOperationalProfileDraft = () => {
  sessionStorage.removeItem(OPERATIONAL_PROFILE_DRAFT_KEY);
};

export const useInstructorOnboarding = () => {
  const { currentStep, visitedSteps, setMemoryRouter, submitStep, isSubmittingStep, error } = useOnboarding();

  const [operationalProfileDraft, setOperationalProfileDraft] = useState<OperationalProfilePayload>(() =>
    readOperationalProfileDraft(),
  );

  const canNavigateToStep = useCallback(
    (step: ProfileDataKey) => {
      return visitedSteps.has(`${ProfileTrackKey.INSTRUCTOR}:${step}`);
    },
    [visitedSteps],
  );

  const goToStep = useCallback(
    (step: ProfileDataKey) => {
      if (!canNavigateToStep(step)) return;

      setMemoryRouter(prev => ({
        ...prev,
        currentStep: {
          track: ProfileTrackKey.INSTRUCTOR,
          step,
        },
      }));
    },
    [canNavigateToStep, setMemoryRouter],
  );

  const submitOperationalProfileStep = useCallback(
    (payload: OperationalProfilePayload) => {
      try {
        void submitStep({
          track: ProfileTrackKey.INSTRUCTOR,
          stepKey: ProfileDataKey.OPERATIONAL_PROFILE,
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
    (payload: CertificationsProfilePayload) => {
      void submitStep({
        track: ProfileTrackKey.INSTRUCTOR,
        stepKey: ProfileDataKey.CERTIFICATIONS,
        payload,
      });
    },
    [submitStep],
  );

  const skipCertificationsStep = useCallback(() => {
    void submitStep({
      track: ProfileTrackKey.INSTRUCTOR,
      stepKey: ProfileDataKey.CERTIFICATIONS,
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
