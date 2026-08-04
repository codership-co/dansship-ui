import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { ActiveSubscription } from './subscriptions.models';

export class SubscriptionsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getUserSubscriptions(userId: string) {
    return this.httpClient.callNoError<Array<ActiveSubscription>>({
      path: `/admin/subscriptions/user/${userId}`,
      method: 'GET',
    });
  }
}
