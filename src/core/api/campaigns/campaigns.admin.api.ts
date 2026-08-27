import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  Campaign,
  CampaignResponseItem,
  CreateCampaignPayload,
  ListCampaignsParams,
  StructuredCampaignType,
  UpdateCampaignPayload,
} from './campaigns.models';

export class CampaignsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async list(params?: ListCampaignsParams) {
    return this.httpClient.callNoError<Array<Campaign>>({
      path: '/admin/campaigns',
      method: 'GET',
      params,
    });
  }

  async get(id: string) {
    return this.httpClient.callNoError<Campaign>({
      path: `/admin/campaigns/${id}`,
      method: 'GET',
    });
  }

  async listStructuredTypes() {
    return this.httpClient.callNoError<Array<StructuredCampaignType>>({
      path: '/admin/campaigns/structured-types',
      method: 'GET',
    });
  }

  async create(payload: CreateCampaignPayload) {
    return this.httpClient.callNoError<Campaign, CreateCampaignPayload>({
      path: '/admin/campaigns',
      method: 'POST',
      data: payload,
    });
  }

  async update(id: string, payload: UpdateCampaignPayload) {
    return this.httpClient.callNoError<Campaign, UpdateCampaignPayload>({
      path: `/admin/campaigns/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async deactivate(id: string) {
    return this.httpClient.callNoError<Campaign>({
      path: `/admin/campaigns/${id}/deactivate`,
      method: 'POST',
    });
  }

  async reactivate(id: string) {
    return this.httpClient.callNoError<Campaign>({
      path: `/admin/campaigns/${id}/reactivate`,
      method: 'POST',
    });
  }

  async listResponses(id: string) {
    return this.httpClient.callNoError<Array<CampaignResponseItem>>({
      path: `/admin/campaigns/${id}/responses`,
      method: 'GET',
    });
  }
}
