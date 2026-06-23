import { HttpClient } from 'polpo-http-client';

import { CompleteStepPayload, OnboardingStatus } from './onboarding.models';

export class OnboardingAPI {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

  async getStatus() {
    return this.httpClient.callNoError<OnboardingStatus>({
      path: '/onboarding/status',
      method: 'GET',
    });
  }

  async completeStep({ stepKey, ...payload }: CompleteStepPayload) {
    return this.httpClient.callNoError<OnboardingStatus, Omit<CompleteStepPayload, 'stepKey'>>({
      path: `/onboarding/steps/${stepKey}/complete`,
      method: 'POST',
      data: payload,
    });
  }
}
