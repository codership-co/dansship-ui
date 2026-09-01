import { HttpClient } from 'polpo-http-client';

import { normalizeSubscription } from './subscriptions.helpers';

import { DansshipAPIError } from '@core/api';

import type { ActiveSubscription, ExtendSubscriptionPayload } from './subscriptions.models';

export class SubscriptionsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getUserSubscriptions(userId: string) {
    return this.httpClient.callNoError<Array<ActiveSubscription>>({
      path: `/admin/subscriptions/user/${userId}`,
      method: 'GET',
    });
  }

  async extend(subscriptionId: string, payload: ExtendSubscriptionPayload) {
    return this.httpClient.callNoError<ActiveSubscription, ExtendSubscriptionPayload>(
      {
        path: `/admin/subscriptions/${subscriptionId}/extend`,
        method: 'POST',
        data: payload,
      },
      normalizeSubscription,
    );
  }
}
