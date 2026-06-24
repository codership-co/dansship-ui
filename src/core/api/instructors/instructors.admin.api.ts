import { HttpClient } from 'polpo-http-client';

import {
  type AdminInstructorListItem,
  type AvailabilityApiItem,
  type AvailabilityWeek,
  DAY_TO_INDEX,
} from './instructors.models';

import { DansshipAPIError } from '@core/api';

export class InstructorsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getInstructors() {
    return this.httpClient.callNoError<Array<AdminInstructorListItem>>({
      path: '/admin/instructors',
      method: 'GET',
    });
  }

  async getAdminAvailability(id: string, week: string) {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, AvailabilityWeek>(
      {
        path: `/admin/instructors/${id}/availability`,
        method: 'GET',
        params: { week },
      },
      data => ({
        week,
        slots: data.map(item => ({
          day_of_week: DAY_TO_INDEX[item.day_of_week],
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      }),
    );
  }
}
