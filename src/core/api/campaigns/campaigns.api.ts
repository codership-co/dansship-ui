import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { CampaignResponseItem, CampaignSubmitPayload, PendingCampaignEnvelope } from './campaigns.models';

export class CampaignsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getPending() {
    return this.httpClient.callNoError<PendingCampaignEnvelope>({
      path: '/campaigns/pending',
      method: 'GET',
    });
  }

  async submitResponse(campaignId: string, payload: CampaignSubmitPayload) {
    return this.httpClient.callNoError<CampaignResponseItem, CampaignSubmitPayload>({
      path: `/campaigns/${campaignId}/responses`,
      method: 'POST',
      data: payload,
    });
  }

  async dismiss(campaignId: string) {
    return this.httpClient.callNoError<CampaignResponseItem>({
      path: `/campaigns/${campaignId}/dismiss`,
      method: 'POST',
    });
  }
}
