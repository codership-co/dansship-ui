import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { PublishedClass } from '../bookings/bookings.models';

export class SchedulesAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getPublishedClassesByRange(startAt: string, endAt: string) {
    return this.httpClient.callNoError<Array<PublishedClass>>({
      path: '/schedules/classes',
      method: 'GET',
      params: {
        start_at: startAt,
        end_at: endAt,
      },
    });
  }
}
