import { HttpClient } from 'polpo-http-client';

import {
  CompleteStepPayload,
  OnboardingStatus,
  OnboardingUploadPurpose,
  OnboardingUploadRequest,
  PresignedUploadResponse,
} from './onboarding.models';

import { DansshipAPIError } from '@core/api';

export class OnboardingAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getStatus() {
    return this.httpClient.call<OnboardingStatus>({
      path: '/onboarding/status',
      method: 'GET',
    });
  }

  async completeStep({ stepKey, ...payload }: CompleteStepPayload) {
    return this.httpClient.call<OnboardingStatus, Omit<CompleteStepPayload, 'stepKey'>>({
      path: `/onboarding/steps/${stepKey}/complete`,
      method: 'POST',
      data: payload,
    });
  }

  private async getUploadUrl(payload: OnboardingUploadRequest) {
    return this.httpClient.callNoError<PresignedUploadResponse, OnboardingUploadRequest>({
      path: '/onboarding/uploads/upload-url',
      method: 'POST',
      data: payload,
    });
  }

  async uploadDocument(
    file: File,
    purpose: OnboardingUploadPurpose = OnboardingUploadPurpose.INSTRUCTOR_CERTIFICATION,
  ) {
    const { data } = await this.getUploadUrl({
      purpose,
      content_type: file.type,
    });

    if (!data?.upload_url || !data.file_key) {
      throw new Error('Failed to get onboarding upload url');
    }

    const uploadResponse = await fetch(data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload onboarding document');
    }

    return data.file_key;
  }
}
