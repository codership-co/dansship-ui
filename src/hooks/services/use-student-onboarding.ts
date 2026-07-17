import { useCallback } from 'react';

import {
  CompleteHealthStepPayload,
  CompletePreferencesStepPayload,
  CompleteStudentStepPayload,
  OnboardingStepKey,
  OnboardingTrackKey,
} from '@core/api';
import { useOnboarding } from '@hooks';

export const useStudentOnboarding = () => {
  const { currentStep, submitStep, isSubmittingStep, error } = useOnboarding();

  const submitProfileStep = useCallback(
    (payload: CompleteStudentStepPayload['payload']) => {
      void submitStep({
        track: OnboardingTrackKey.STUDENT,
        stepKey: OnboardingStepKey.PROFILE,
        payload,
      });
    },
    [submitStep],
  );

  const submitHealthStep = useCallback(
    (payload: CompleteHealthStepPayload['payload']) => {
      void submitStep({
        track: OnboardingTrackKey.STUDENT,
        stepKey: OnboardingStepKey.HEALTH,
        payload,
      });
    },
    [submitStep],
  );

  const skipHealthStep = useCallback(() => {
    void submitStep({
      track: OnboardingTrackKey.STUDENT,
      stepKey: OnboardingStepKey.HEALTH,
      payload: {},
    });
  }, [submitStep]);

  const submitPreferencesStep = useCallback(
    (payload: CompletePreferencesStepPayload['payload']) => {
      void submitStep({
        track: OnboardingTrackKey.STUDENT,
        stepKey: OnboardingStepKey.PREFERENCES,
        payload,
      });
    },
    [submitStep],
  );

  const skipPreferencesStep = useCallback(() => {
    void submitStep({
      track: OnboardingTrackKey.STUDENT,
      stepKey: OnboardingStepKey.PREFERENCES,
      payload: {
        goals: [],
        disciplines: [],
        preferred_schedules: [],
      },
    });
  }, [submitStep]);

  return {
    currentStep,
    isSubmittingStep,
    error,
    submitProfileStep,
    submitHealthStep,
    skipHealthStep,
    submitPreferencesStep,
    skipPreferencesStep,
  };
};
