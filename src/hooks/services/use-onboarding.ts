import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useAuth } from '@contexts';
import { CompleteStepPayload, DansshipAPI, OnboardingStatus, OnboardingStepKey, OnboardingTrackKey } from '@core/api';
import { useCallablePromise } from '@hooks';

export const parseNextStep = (nextStep: string | null): OnboardingCurrentStep | null => {
  if (!nextStep) return null;

  const [track, step] = nextStep.split(':');

  if (!track || !step) return null;

  return {
    track: track as OnboardingTrackKey,
    step: step as OnboardingStepKey,
  };
};

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

  const { call: getStatus, isLoading } = useCallablePromise(async () => {
    try {
      const data = await DansshipAPI.onboarding.getStatus();
      const nextStep = parseNextStep(data.next_step);

      setMemoryRouter({
        status: data,
        currentStep: nextStep,
        visitedSteps: nextStep ? new Set([`${nextStep.track}:${nextStep.step}`]) : new Set(),
      });
    } catch {
      setError(t('auth:onboarding.loadFailed'));
    }
  });

  const [memoryRouter, setMemoryRouter] = useState<MemoryRouterState>({
    currentStep: null,
    visitedSteps: new Set(),
    status: null,
  });

  const { call: submitStep, isLoading: completeOnboardingStepIsLoading } = useCallablePromise(
    async (data: CompleteStepPayload) => {
      setError(null);

      try {
        const response = await DansshipAPI.onboarding.completeStep(data);
        const nextStep = parseNextStep(response.next_step);

        setMemoryRouter(prev => {
          const newVisitedSteps = new Set(prev.visitedSteps);

          if (nextStep) {
            newVisitedSteps.add(`${nextStep.track}:${nextStep.step}`);
          }

          return {
            ...prev,
            status: response,
            currentStep: nextStep,
            visitedSteps: newVisitedSteps,
          };
        });
      } catch {
        setError(t('auth:onboarding.submitFailed'));
      }
    },
  );

  useEffect(() => {
    void getStatus();
  }, [getStatus]);

  useEffect(() => {
    if (!memoryRouter.status?.completed || !requireOnboarding) return;

    //.then(user => { navigate(user?.baseProfileRedirect ?? PageURLS.home, { replace: true }); });
    getProfile();
  }, [getProfile, memoryRouter.status?.completed, navigate, requireOnboarding]);

  return {
    status: memoryRouter.status,
    visitedSteps: memoryRouter.visitedSteps,
    currentStep: memoryRouter.currentStep,
    isSubmittingStep: completeOnboardingStepIsLoading,
    isLoading,
    submitStep,
    setMemoryRouter,
    error,
  };
};
