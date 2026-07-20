import { useCallback } from 'react';

import {
  BasicProfilePayload,
  HealthProfilePayload,
  PreferencesProfilePayload,
  ProfileDataKey,
  ProfileTrackKey,
} from '@core/api';
import { useOnboarding } from '@hooks';

export const useStudentOnboarding = () => {
  const { currentStep, submitStep, isSubmittingStep, error } = useOnboarding();

  const submitProfileStep = useCallback(
    (payload: BasicProfilePayload) => {
      void submitStep({
        track: ProfileTrackKey.STUDENT,
        stepKey: ProfileDataKey.PROFILE,
        payload,
      });
    },
    [submitStep],
  );

  const submitHealthStep = useCallback(
    (payload: HealthProfilePayload) => {
      void submitStep({
        track: ProfileTrackKey.STUDENT,
        stepKey: ProfileDataKey.HEALTH,
        payload,
      });
    },
    [submitStep],
  );

  const skipHealthStep = useCallback(() => {
    void submitStep({
      track: ProfileTrackKey.STUDENT,
      stepKey: ProfileDataKey.HEALTH,
      payload: {},
    });
  }, [submitStep]);

  const submitPreferencesStep = useCallback(
    (payload: PreferencesProfilePayload) => {
      void submitStep({
        track: ProfileTrackKey.STUDENT,
        stepKey: ProfileDataKey.PREFERENCES,
        payload,
      });
    },
    [submitStep],
  );

  const skipPreferencesStep = useCallback(() => {
    void submitStep({
      track: ProfileTrackKey.STUDENT,
      stepKey: ProfileDataKey.PREFERENCES,
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
