import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { BenefitGrant, ListBenefitGrantsParams } from './benefits.models';

export class BenefitsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listGrants(params: ListBenefitGrantsParams) {
    return this.httpClient.callNoError<Array<BenefitGrant>>({
      path: '/admin/benefits/grants',
      method: 'GET',
      params,
    });
  }
}
