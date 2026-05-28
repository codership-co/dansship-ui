export interface OnboardingStep {
  step_key: string;
  status: string;
  completed: boolean;
}

export interface OnboardingTrack {
  track: string;
  completed: boolean;
  pending_steps: Array<string>;
  steps: Array<OnboardingStep>;
}

export interface OnboardingStatus {
  required: boolean;
  completed: boolean;
  next_step: string | null;
  tracks: Array<OnboardingTrack>;
}

export interface CompleteStepPayload {
  track: string;
  payload: Record<string, unknown>;
}
