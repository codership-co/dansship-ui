import { HttpClient } from 'polpo-http-client';

import type { PublishedClass } from '../bookings/bookings.models';

export class SchedulesAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getPublishedClassesByRange(startAt: string, endAt: string) {
    return this.httpClient.call<Array<PublishedClass>>({
      path: '/schedules/classes',
      method: 'DELETE',
      params: {
        start_at: startAt,
        end_at: endAt,
      },
    });
  }
}
