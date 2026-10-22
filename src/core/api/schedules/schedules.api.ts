import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { UpcomingWeekResponse } from './schedules.models';
import type { PublishedClass } from '../bookings/bookings.models';

export class SchedulesAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getPublishedClassesByRange(startAt: string, endAt: string, attendeeUserId?: string) {
    return this.httpClient.callNoError<Array<PublishedClass>>({
      path: '/schedules/classes',
      method: 'GET',
      params: {
        start_at: startAt,
        end_at: endAt,
        ...(attendeeUserId ? { attendee_user_id: attendeeUserId } : {}),
      },
    });
  }

  async getUpcomingWeek(fromWeek?: string, attendeeUserId?: string) {
    return this.httpClient.callNoError<UpcomingWeekResponse<PublishedClass>>({
      path: '/schedules/upcoming-week',
      method: 'GET',
      params: {
        ...(fromWeek ? { from: fromWeek } : {}),
        ...(attendeeUserId ? { attendee_user_id: attendeeUserId } : {}),
      },
    });
  }
}
