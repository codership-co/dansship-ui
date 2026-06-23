import { HttpClient } from 'polpo-http-client';

import type {
  CreateDiscountPayload,
  CreatePlanPayload,
  Discount,
  GetDiscountsParams,
  GetPlansParams,
  Plan,
  UpdateDiscountPayload,
  UpdatePlanPayload,
} from './billing.models';

export class BillingAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

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

  async getDiscounts(payload?: GetDiscountsParams) {
    return this.httpClient.callNoError<Array<Discount>>({
      path: '/admin/discounts',
      method: 'GET',
      params: payload,
    });
  }

  async createDiscount(payload: CreateDiscountPayload) {
    return this.httpClient.callNoError<Discount, CreateDiscountPayload>({
      path: '/admin/discounts',
      method: 'POST',
      data: payload,
    });
  }

  async updateDiscount(id: string, payload: UpdateDiscountPayload) {
    return this.httpClient.callNoError<Discount, UpdateDiscountPayload>({
      path: `/admin/discounts/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async deleteDiscount(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/discounts/${id}/deactivate`,
      method: 'POST',
    });
  }

  async reactivateDiscount(id: string) {
    return this.httpClient.callNoError<Discount>({
      path: `/admin/discounts/${id}/reactivate`,
      method: 'POST',
    });
  }
}
