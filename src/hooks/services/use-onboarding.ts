import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useAuth } from '@contexts';
import {
  CompleteCertificationsStepPayload,
  CompleteHealthStepPayload,
  CompleteOperationalProfileStepPayload,
  CompletePreferencesStepPayload,
  CompleteStepPayload,
  CompleteStudentStepPayload,
  DansshipAPI,
  OnboardingStatus,
  OnboardingStepKey,
  OnboardingTrackKey,
} from '@core/api';
import { FORCE_INSTRUCTOR_ONBOARDING_KEY, PageURLS } from '@core/constants';
import { useCallablePromise } from '@hooks';

export interface OnboardingCurrentStep {
  track: OnboardingTrackKey;
  step: OnboardingStepKey;
}

const OPERATIONAL_PROFILE_DRAFT_KEY = 'instructor_operational_profile_draft';

const readOperationalProfileDraft = (): CompleteOperationalProfileStepPayload['payload'] | null => {
  try {
    const raw = sessionStorage.getItem(OPERATIONAL_PROFILE_DRAFT_KEY);

    return raw ? (JSON.parse(raw) as CompleteOperationalProfileStepPayload['payload']) : null;
  } catch {
    return null;
  }
};

const writeOperationalProfileDraft = (payload: CompleteOperationalProfileStepPayload['payload']) => {
  sessionStorage.setItem(OPERATIONAL_PROFILE_DRAFT_KEY, JSON.stringify(payload));
};

const clearOperationalProfileDraft = () => {
  sessionStorage.removeItem(OPERATIONAL_PROFILE_DRAFT_KEY);
};

interface MemoryRouterState {
  currentStep: OnboardingCurrentStep | null;
  visitedSteps: Set<string>;
  status: OnboardingStatus | null;
  operationalProfileDraft: CompleteOperationalProfileStepPayload['payload'] | null;
}

interface UseOnboardingOptions {
  preferredTrack?: OnboardingTrackKey;
}

const parseNextStep = (nextStep: string | null): OnboardingCurrentStep | null => {
  if (!nextStep) return null;

  const [track, step] = nextStep.split(':');

  if (!track || !step) return null;

  return {
    track: track as OnboardingTrackKey,
    step: step as OnboardingStepKey,
  };
};

const resolveCurrentStep = (
  status: OnboardingStatus,
  preferredTrack?: OnboardingTrackKey,
): OnboardingCurrentStep | null => {
  if (preferredTrack) {
    const trackStatus = status.tracks.find(track => track.track === preferredTrack && !track.completed);
    const pendingStep = trackStatus?.pending_steps[0];

    if (pendingStep) {
      return {
        track: preferredTrack,
        step: pendingStep,
      };
    }

    return null;
  }

  return parseNextStep(status.next_step);
};

const buildVisitedSteps = (
  status: OnboardingStatus,
  currentStep: OnboardingCurrentStep | null,
  preferredTrack?: OnboardingTrackKey,
) => {
  const visitedSteps = new Set<string>();

  if (preferredTrack) {
    const trackStatus = status.tracks.find(track => track.track === preferredTrack);

    trackStatus?.steps
      .filter(step => step.completed)
      .forEach(step => {
        visitedSteps.add(`${preferredTrack}:${step.step_key}`);
      });
  }

  if (currentStep) {
    visitedSteps.add(`${currentStep.track}:${currentStep.step}`);
  }

  return visitedSteps;
};

export const useOnboarding = ({ preferredTrack }: UseOnboardingOptions = {}) => {
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
    operationalProfileDraft: readOperationalProfileDraft(),
  });

  const clearForceInstructorTrack = useCallback(() => {
    sessionStorage.removeItem(FORCE_INSTRUCTOR_ONBOARDING_KEY);
  }, []);

  const getStatus = useCallback(async () => {
    try {
      const { data } = await getOnboardingStatus();

      if (data) {
        const nextStep = resolveCurrentStep(data, preferredTrack);

        if (preferredTrack === OnboardingTrackKey.INSTRUCTOR && !nextStep) {
          clearForceInstructorTrack();
        }

        setMemoryRouter(prev => ({
          ...prev,
          status: data,
          currentStep: nextStep,
          visitedSteps: buildVisitedSteps(data, nextStep, preferredTrack),
        }));
      } else {
        setError(t('auth:onboarding.loadFailed'));
      }
    } catch {
      setError(t('auth:onboarding.loadFailed'));
    }
  }, [clearForceInstructorTrack, getOnboardingStatus, preferredTrack, t]);

  const canNavigateToStep = useCallback(
    (step: OnboardingStepKey) => {
      if (!preferredTrack) return false;

      return memoryRouter.visitedSteps.has(`${preferredTrack}:${step}`);
    },
    [memoryRouter.visitedSteps, preferredTrack],
  );

  const goToStep = useCallback(
    (step: OnboardingStepKey) => {
      if (!preferredTrack || !canNavigateToStep(step)) return;

      setMemoryRouter(prev => ({
        ...prev,
        currentStep: {
          track: preferredTrack,
          step,
        },
      }));
    },
    [canNavigateToStep, preferredTrack],
  );

  const submitStep = useCallback(
    async (data: CompleteStepPayload) => {
      setError(null);

      try {
        const response = await completeOnboardingStep(data);

        if (response.data) {
          const nextStep = resolveCurrentStep(response.data, preferredTrack);

          if (preferredTrack === OnboardingTrackKey.INSTRUCTOR && !nextStep) {
            clearForceInstructorTrack();
          }

          setMemoryRouter(prev => {
            const operationalProfileDraft =
              data.stepKey === OnboardingStepKey.OPERATIONAL_PROFILE ? data.payload : prev.operationalProfileDraft;

            if (data.stepKey === OnboardingStepKey.OPERATIONAL_PROFILE) {
              writeOperationalProfileDraft(data.payload);
            }

            if (preferredTrack === OnboardingTrackKey.INSTRUCTOR && !nextStep) {
              clearOperationalProfileDraft();
            }

            return {
              ...prev,
              status: response.data,
              currentStep: nextStep,
              visitedSteps: buildVisitedSteps(response.data, nextStep, preferredTrack),
              operationalProfileDraft,
            };
          });
        } else {
          setError(t('auth:onboarding.submitFailed'));
        }
      } catch {
        setError(t('auth:onboarding.submitFailed'));
      }
    },
    [clearForceInstructorTrack, completeOnboardingStep, preferredTrack, t],
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

  const submitOperationalProfileStep = useCallback(
    (data: Omit<CompleteOperationalProfileStepPayload, 'stepKey'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.OPERATIONAL_PROFILE,
        ...data,
      });
    },
    [submitStep],
  );

  const submitCertificationsStep = useCallback(
    (data: Omit<CompleteCertificationsStepPayload, 'stepKey'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.CERTIFICATIONS,
        ...data,
      });
    },
    [submitStep],
  );

  const skipCertificationsStep = useCallback(
    (data: Omit<CompleteCertificationsStepPayload, 'stepKey' | 'payload'>) => {
      void submitStep({
        stepKey: OnboardingStepKey.CERTIFICATIONS,
        payload: {
          documents: [],
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

    clearForceInstructorTrack();
    clearOperationalProfileDraft();
    getProfile().then(user => {
      navigate(user?.baseProfileRedirect ?? PageURLS.home, { replace: true });
    });
  }, [clearForceInstructorTrack, getProfile, memoryRouter.status?.completed, navigate, requireOnboarding]);

  return {
    status: memoryRouter.status,
    isLoading: getOngetOnboardingStatusIsLoading,
    isSubmitting: completeOnboardingStepIsLoading,
    currentStep: memoryRouter.currentStep,
    operationalProfileDraft: memoryRouter.operationalProfileDraft,
    error,
    canNavigateToStep,
    goToStep,
    submitProfileStep,
    submitHealthStep,
    skipHealthStep,
    submitPreferencesStep,
    skipPreferencesStep,
    submitOperationalProfileStep,
    submitCertificationsStep,
    skipCertificationsStep,
  };
};
