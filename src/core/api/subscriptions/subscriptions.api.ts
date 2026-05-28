import { normalizePlan, normalizeSubscription, toNumber } from './subscriptions.helpers';

import { HttpClient } from '@core/http-client';

import type {
  ActiveSubscription,
  DiscountPreviewRequest,
  DiscountPreviewResponse,
  MySubscriptionsResponse,
  PublicPlan,
  PurchaseSubscriptionPayload,
  SubscriptionSummary,
} from './subscriptions.models';

export class SubscriptionsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getPublicPlans() {
    return this.httpClient.call<Array<PublicPlan>>(
      {
        path: '/landing/plans/top',
        method: 'GET',
      },
      plans => plans.map(normalizePlan),
    );
  }

  async purchaseSubscription(payload: PurchaseSubscriptionPayload) {
    return this.httpClient.call<ActiveSubscription, PurchaseSubscriptionPayload>({
      path: '/subscriptions',
      method: 'POST',
      data: payload,
    });
  }

  async previewDiscount(payload: DiscountPreviewRequest) {
    return this.httpClient.call<DiscountPreviewResponse, DiscountPreviewRequest>(
      {
        path: '/discounts/preview',
        method: 'POST',
        data: payload,
      },
      data => ({
        ...data,
        discount_applied: data.discount_applied === true,
        original_price: data.original_price !== undefined ? toNumber(data.original_price) : undefined,
        final_price: data.final_price !== undefined ? toNumber(data.final_price) : undefined,
        discount_value:
          data.discount_value !== undefined && data.discount_value !== null ? toNumber(data.discount_value) : null,
        rejection_reason: data.rejection_reason ?? data.reason ?? data.message ?? null,
      }),
    );
  }

  async getMySubscriptions() {
    return this.httpClient.call<MySubscriptionsResponse>(
      {
        path: '/subscriptions/me',
        method: 'GET',
      },
      data => ({
        subscriptions: (data.subscriptions ?? []).map(normalizeSubscription),
        summary: data.summary ?? { total_remaining_classes: 0, active_count: 0, next_expiration: null },
      }),
    );
  }

  async getSubscriptionSummary() {
    return this.httpClient.call<SubscriptionSummary>({
      path: '/subscriptions/me/summary',
      method: 'GET',
    });
  }
}
