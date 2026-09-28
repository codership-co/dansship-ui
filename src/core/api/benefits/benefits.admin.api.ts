import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  BenefitGrant,
  BenefitWindow,
  ListBenefitGrantsParams,
  UpdateBenefitWindowPayload,
} from './benefits.models';

export class BenefitsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listGrants(params: ListBenefitGrantsParams) {
    return this.httpClient.callNoError<Array<BenefitGrant>>({
      path: '/admin/benefits/grants',
      method: 'GET',
      params,
    });
  }

  async listWindows() {
    return this.httpClient.callNoError<Array<BenefitWindow>>({
      path: '/admin/benefits/windows',
      method: 'GET',
    });
  }

  async updateWindow(id: string, payload: UpdateBenefitWindowPayload) {
    return this.httpClient.callNoError<BenefitWindow, UpdateBenefitWindowPayload>({
      path: `/admin/benefits/windows/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }
}
