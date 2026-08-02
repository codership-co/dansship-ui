import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { CreatePlanPayload, GetPlansParams, Plan, TaxType, UpdatePlanPayload } from './billing.models';

export class BillingAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getTaxTypes() {
    return this.httpClient.callNoError<Array<TaxType>>({
      path: '/admin/tax-types',
      method: 'GET',
    });
  }

  async getPlans(payload?: GetPlansParams) {
    return this.httpClient.callNoError<Array<Plan>>({
      path: '/admin/plans',
      method: 'GET',
      params: payload,
    });
  }

  async createPlan(payload: CreatePlanPayload) {
    return this.httpClient.callNoError<Plan, CreatePlanPayload>({
      path: '/admin/plans',
      method: 'POST',
      data: payload,
    });
  }

  async updatePlan(id: string, payload: UpdatePlanPayload) {
    return this.httpClient.callNoError<Plan, UpdatePlanPayload>({
      path: `/admin/plans/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async deletePlan(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/plans/${id}/deactivate`,
      method: 'POST',
    });
  }

  async reactivatePlan(id: string) {
    return this.httpClient.callNoError<Plan>({
      path: `/admin/plans/${id}/reactivate`,
      method: 'POST',
    });
  }
}
