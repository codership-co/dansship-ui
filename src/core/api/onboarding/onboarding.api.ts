import { HttpClient } from 'polpo-http-client';

import type { CompleteStepPayload, OnboardingStatus } from './onboarding.models';

export class OnboardingAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getStatus() {
    return this.httpClient.call<OnboardingStatus>({
      path: '/onboarding/status',
      method: 'GET',
    });
  }

  async completeStep(stepKey: string, payload: CompleteStepPayload) {
    return this.httpClient.call<OnboardingStatus, CompleteStepPayload>({
      path: `/onboarding/steps/${stepKey}/complete`,
      method: 'POST',
      data: payload,
    });
  }
}
