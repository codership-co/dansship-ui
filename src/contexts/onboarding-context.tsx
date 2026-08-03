import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useCallablePromise } from '../hooks/use-callable-promise';

import { useAuth } from './auth-context';

import {
  CompleteStepPayload,
  DansshipAPI,
  DansshipAPIError,
  OnboardingStatus,
  ProfileDataKey,
  ProfileTrackKey,
} from '@core/api';
import { addSentryBreadcrumb, captureUnexpectedException } from '@core/sentry';

const parseNextStep = (nextStep: string | null): OnboardingCurrentStep | null => {
  if (!nextStep) return null;

  const [track, step] = nextStep.split(':');

  if (!track || !step) return null;

  return {
    track: track as ProfileTrackKey,
    step: step as ProfileDataKey,
  };
};

export interface OnboardingCurrentStep {
  track: ProfileTrackKey;
  step: ProfileDataKey;
}

interface MemoryRouterState {
  currentStep: OnboardingCurrentStep | null;
  visitedSteps: Set<string>;
  status: OnboardingStatus | null;
}

interface OnboardingContextState {
  status: OnboardingStatus | null;
  visitedSteps: Set<string>;
  currentStep: OnboardingCurrentStep | null;
  isSubmittingStep: boolean;
  isLoading: boolean;
  submitStep: ReturnType<typeof useCallablePromise<OnboardingStatus | null, [CompleteStepPayload]>>['call'];
  setMemoryRouter: Dispatch<SetStateAction<MemoryRouterState>>;
  error: string | null;
}

const OnboardingContext = createContext<OnboardingContextState | null>(null);

const handleMemoryRouter = (prev: MemoryRouterState, status: OnboardingStatus) => {
  const nextStep = parseNextStep(status.next_step);
  const newVisitedSteps = new Set(prev.visitedSteps);

  if (nextStep) {
    newVisitedSteps.add(`${nextStep.track}:${nextStep.step}`);
  }

  return {
    ...prev,
    status,
    currentStep: nextStep,
    visitedSteps: newVisitedSteps,
  };
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const { t } = useTranslation();
  const { getProfile, requireOnboarding } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { call: getStatus, isLoading } = useCallablePromise(async () => {
    try {
      const data = await DansshipAPI.onboarding.getStatus();
      setMemoryRouter(prev => handleMemoryRouter(prev, data));
    } catch (loadError) {
      setError(t('auth:onboarding.loadFailed'));
      captureUnexpectedException(loadError, { tags: { flow: 'onboarding.load' } });
    }
  });

  const [memoryRouter, setMemoryRouter] = useState<MemoryRouterState>({
    currentStep: null,
    visitedSteps: new Set(),
    status: null,
  });

  const { call: submitStep, isLoading: completeOnboardingStepIsLoading } = useCallablePromise(
    async (data: CompleteStepPayload): Promise<OnboardingStatus | null> => {
      setError(null);
      addSentryBreadcrumb('onboarding.step', 'Submitting onboarding step', {
        track: data.track,
        step: data.stepKey,
      });

      try {
        const response = await DansshipAPI.onboarding.completeStep(data);
        setMemoryRouter(prev => handleMemoryRouter(prev, response));

        return response;
      } catch (submitError) {
        setError(t('auth:onboarding.submitFailed'));

        // API client already reports DansshipAPIError to Sentry; avoid double-capture + unhandled rejection.
        if (!(submitError instanceof DansshipAPIError)) {
          captureUnexpectedException(submitError, {
            tags: { flow: 'onboarding.submit', track: String(data.track), step: String(data.stepKey) },
          });
        }

        return null;
      }
    },
  );

  useEffect(() => {
    void getStatus();
  }, [getStatus]);

  useEffect(() => {
    if (!memoryRouter.status?.completed || !requireOnboarding) return;

    void getStatus();
    void getProfile();
  }, [getProfile, getStatus, memoryRouter.status?.completed, requireOnboarding]);

  return (
    <OnboardingContext.Provider
      value={{
        status: memoryRouter.status,
        visitedSteps: memoryRouter.visitedSteps,
        currentStep: memoryRouter.currentStep,
        isSubmittingStep: completeOnboardingStepIsLoading,
        isLoading,
        submitStep,
        setMemoryRouter,
        error,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  return context;
};
