import { HttpClient } from 'polpo-http-client';

import { normalizePlan, normalizeSubscription } from './subscriptions.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  ActiveSubscription,
  MySubscriptionsResponse,
  PublicPlan,
  PurchaseSubscriptionPayload,
  SubscriptionSummary,
} from './subscriptions.models';

export class SubscriptionsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getPublicPlans() {
    return this.httpClient.callNoError<Array<PublicPlan>>(
      {
        path: '/landing/plans/top',
        method: 'GET',
      },
      plans => plans.map(normalizePlan),
    );
  }

  async purchaseSubscription(payload: PurchaseSubscriptionPayload) {
    return this.httpClient.callNoError<ActiveSubscription, PurchaseSubscriptionPayload>({
      path: '/subscriptions',
      method: 'POST',
      data: payload,
    });
  }

  async getMySubscriptions() {
    return this.httpClient.callNoError<MySubscriptionsResponse>(
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
    return this.httpClient.callNoError<SubscriptionSummary>({
      path: '/subscriptions/me/summary',
      method: 'GET',
    });
  }
}
