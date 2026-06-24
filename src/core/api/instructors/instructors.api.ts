import { HttpClient } from 'polpo-http-client';

import {
  type AvailabilityApiItem,
  type AvailabilityWeek,
  type ClassRosterResponse,
  type CreateInstructorProfilePayload,
  DAY_TO_INDEX,
  INDEX_TO_DAY,
  type InstructorProfile,
  type InstructorUserSearchResult,
  type ManualAddStudentPayload,
  type UpdateAvailabilityPayload,
  type UpdateInstructorProfilePayload,
} from './instructors.models';

import { DansshipAPIError } from '@core/api';

import type { ScheduledClass } from '../schedules/schedules.models';

export class InstructorsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getProfile() {
    return this.httpClient.callNoError<InstructorProfile>({
      path: '/instructors/profile',
      method: 'GET',
    });
  }

  async createProfile(payload: CreateInstructorProfilePayload) {
    return this.httpClient.callNoError<InstructorProfile>({
      path: '/instructors/profile',
      method: 'POST',
      data: payload,
    });
  }

  async updateProfile(payload: UpdateInstructorProfilePayload) {
    return this.httpClient.callNoError<InstructorProfile>({
      path: '/instructors/profile',
      method: 'PUT',
      data: payload,
    });
  }

  async getAvailability(week: string) {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, AvailabilityWeek>(
      {
        path: '/instructors/availability',
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

  async updateAvailability(payload: UpdateAvailabilityPayload) {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, AvailabilityWeek>(
      {
        path: '/instructors/availability',
        method: 'POST',
        data: {
          week_start_date: payload.week_start_date,
          slots: payload.slots.map(slot => ({
            day_of_week: INDEX_TO_DAY[slot.day_of_week],
            start_time: slot.start_time,
            end_time: slot.end_time,
          })),
        },
      },
      data => ({
        week: payload.week_start_date,
        slots: data.map(item => ({
          day_of_week: DAY_TO_INDEX[item.day_of_week],
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      }),
    );
  }

  async searchUsersByEmail(email: string) {
    return this.httpClient.callNoError<Array<InstructorUserSearchResult>>({
      path: '/instructors/users/search',
      method: 'GET',
      params: { email },
    });
  }

  async getClassRoster(classId: string) {
    return this.httpClient.callNoError<ClassRosterResponse>({
      path: `/instructors/classes/${classId}/roster`,
      method: 'GET',
    });
  }

  async manualAddStudent(classId: string, payload: ManualAddStudentPayload) {
    return this.httpClient.callNoError<void, ManualAddStudentPayload>({
      path: `/instructors/classes/${classId}/roster`,
      method: 'POST',
      data: payload,
    });
  }

  async getInstructorWeeklySchedule(weekStartDate: string) {
    return this.httpClient.callNoError<Array<ScheduledClass>>({
      path: `/instructors/schedules/weeks/${weekStartDate}/classes`,
      method: 'GET',
    });
  }
}
