import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useAuth } from '@contexts';
import {
  CompleteHealthStepPayload,
  CompletePreferencesStepPayload,
  CompleteStepPayload,
  CompleteStudentStepPayload,
  DansshipAPI,
  OnboardingStatus,
  OnboardingStepKey,
  OnboardingTrackKey,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise } from '@hooks';

export interface OnboardingCurrentStep {
  track: OnboardingTrackKey;
  step: OnboardingStepKey;
}

interface MemoryRouterState {
  currentStep: OnboardingCurrentStep | null;
  visitedSteps: Set<string>;
  status: OnboardingStatus | null;
}

export const useOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getProfile, requireOnboarding } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { call: getOnboardingStatus, isLoading: getOngetOnboardingStatusIsLoading } = useCallablePromise(() =>
    DansshipAPI.onboarding.getStatus(),
  );
  const { call: completeOnboardingStep, isLoading: completeOnboardingStepIsLoading } = useCallablePromise(
    (data: CompleteStepPayload) => DansshipAPI.onboarding.completeStep(data),
  );
  const [memoryRouter, setMemoryRouter] = useState<MemoryRouterState>({
    currentStep: null,
    visitedSteps: new Set(),
    status: null,
  });

  const getStatus = useCallback(async () => {
    try {
      const { data } = await getOnboardingStatus();

      if (data) {
        const nextStepSplited = data.next_step ? data.next_step.split(':') : null;
        const nextStep = nextStepSplited
          ? { track: nextStepSplited[0] as OnboardingTrackKey, step: nextStepSplited[1] as OnboardingStepKey }
          : null;

        setMemoryRouter({
          status: data,
          currentStep: nextStep,
          visitedSteps: nextStep ? new Set([`${nextStep.track}:${nextStep.step}`]) : new Set(),
        });
      } else {
        setError(t('auth:onboarding.loadFailed'));
      }
    } catch {
      setError(t('auth:onboarding.loadFailed'));
    }
  }, [getOnboardingStatus, t]);

  const submitStep = useCallback(
    async (data: CompleteStepPayload) => {
      setError(null);

      try {
        const response = await completeOnboardingStep(data);

        if (response.data) {
          const nextStepSplited = response.data.next_step ? response.data.next_step.split(':') : null;
          const nextStep = nextStepSplited
            ? { track: nextStepSplited[0] as OnboardingTrackKey, step: nextStepSplited[1] as OnboardingStepKey }
            : null;

          setMemoryRouter(prev => {
            const newVisitedSteps = new Set(prev.visitedSteps);

            if (nextStep) {
              newVisitedSteps.add(`${nextStep.track}:${nextStep.step}`);
            }

            return {
              ...prev,
              status: response.data,
              currentStep: nextStep,
              visitedSteps: newVisitedSteps,
            };
          });
        } else {
          setError(t('auth:onboarding.submitFailed'));
        }
      } catch {
        setError(t('auth:onboarding.submitFailed'));
      }
    },
    [completeOnboardingStep, t],
  );

  const submitProfileStep = useCallback(
    (data: Omit<CompleteStudentStepPayload, 'stepKey'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.PROFILE,
        ...data,
      });
    },
    [submitStep],
  );

  const submitHealthStep = useCallback(
    (data: Omit<CompleteHealthStepPayload, 'stepKey'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.HEALTH,
        ...data,
      });
    },
    [submitStep],
  );

  const skipHealthStep = useCallback(
    (data: Omit<CompleteHealthStepPayload, 'stepKey' | 'payload'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.HEALTH,
        payload: {},
        ...data,
      });
    },
    [submitStep],
  );

  const submitPreferencesStep = useCallback(
    (data: Omit<CompletePreferencesStepPayload, 'stepKey'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.PREFERENCES,
        ...data,
      });
    },
    [submitStep],
  );

  const skipPreferencesStep = useCallback(
    (data: Omit<CompletePreferencesStepPayload, 'stepKey' | 'payload'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.PREFERENCES,
        payload: {
          goals: [],
          disciplines: [],
          preferred_schedules: [],
        },
        ...data,
      });
    },
    [submitStep],
  );

  useEffect(() => {
    void getStatus();
  }, [getStatus]);

  useEffect(() => {
    if (!memoryRouter.status?.completed || !requireOnboarding) return;

    getProfile().then(user => {
      navigate(user?.baseProfileRedirect ?? PageURLS.home, { replace: true });
    });
  }, [getProfile, memoryRouter.status?.completed, navigate, requireOnboarding]);

  return {
    status: memoryRouter.status,
    isLoading: getOngetOnboardingStatusIsLoading,
    isSubmitting: completeOnboardingStepIsLoading,
    currentStep: memoryRouter.currentStep,
    error,
    submitProfileStep,
    submitHealthStep,
    skipHealthStep,
    submitPreferencesStep,
    skipPreferencesStep,
  };
};
