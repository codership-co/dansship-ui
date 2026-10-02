import { HttpClient } from 'polpo-http-client';

import {
  type AdminInstructorListItem,
  type AvailabilityApiItem,
  type InstructorAvailability,
  DAY_TO_INDEX,
  type InstructorConvertToRegularResponse,
  type InstructorDeactivateResponse,
  type InstructorInvitePayload,
  type InstructorInviteResponse,
  type InstructorReactivateResponse,
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

  async inviteInstructor(userId: string, payload: InstructorInvitePayload) {
    return this.httpClient.callNoError<InstructorInviteResponse, InstructorInvitePayload>({
      path: `/admin/instructors/${userId}/invite`,
      method: 'POST',
      data: payload,
    });
  }

  async deactivateInstructor(userId: string) {
    return this.httpClient.callNoError<InstructorDeactivateResponse>({
      path: `/admin/instructors/${userId}/deactivate`,
      method: 'POST',
    });
  }

  async reactivateInstructor(userId: string) {
    return this.httpClient.callNoError<InstructorReactivateResponse>({
      path: `/admin/instructors/${userId}/reactivate`,
      method: 'POST',
    });
  }

  async convertSubstituteToRegular(userId: string) {
    return this.httpClient.callNoError<InstructorConvertToRegularResponse>({
      path: `/admin/instructors/${userId}/convert-to-regular`,
      method: 'POST',
    });
  }

  async getAdminAvailability(id: string) {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, InstructorAvailability>(
      {
        path: `/admin/instructors/${id}/availability`,
        method: 'GET',
      },
      data => ({
        slots: data.map(item => ({
          day_of_week: DAY_TO_INDEX[item.day_of_week],
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      }),
    );
  }
}
