import { HttpClient } from 'polpo-http-client';

import {
  type AcceptInstructorInvitePayload,
  type AcceptInstructorInviteResponse,
  type AvailabilityApiItem,
  type InstructorAvailability,
  type ClassRosterResponse,
  type InstructorStudentProfile,
  type CreateInstructorCertificationPayload,
  type CreateInstructorProfilePayload,
  DAY_TO_INDEX,
  INDEX_TO_DAY,
  type InstructorCertification,
  type InstructorCertificationContentType,
  type InstructorCertificationPresignedUpload,
  type InstructorCertificationUploadRequest,
  type InstructorOperationalProfile,
  type InstructorProfile,
  type InstructorUserSearchResult,
  type ManualAddStudentPayload,
  type UpdateAvailabilityPayload,
  type UpdateInstructorOperationalProfilePayload,
  type UpdateInstructorProfilePayload,
} from './instructors.models';

import { DansshipAPIError } from '@core/api';

import type { ScheduledClass, UpcomingWeekResponse } from '../schedules/schedules.models';

export class InstructorsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async acceptInvite(payload: AcceptInstructorInvitePayload) {
    return this.httpClient.call<AcceptInstructorInviteResponse, AcceptInstructorInvitePayload>({
      path: '/instructors/invitations/accept',
      method: 'POST',
      data: payload,
    });
  }

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

  async getOperationalProfile() {
    return this.httpClient.callNoError<InstructorOperationalProfile>({
      path: '/instructors/operational-profile',
      method: 'GET',
    });
  }

  async updateOperationalProfile(payload: UpdateInstructorOperationalProfilePayload) {
    return this.httpClient.callNoError<InstructorOperationalProfile, UpdateInstructorOperationalProfilePayload>({
      path: '/instructors/operational-profile',
      method: 'PUT',
      data: payload,
    });
  }

  async getAvailability() {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, InstructorAvailability>(
      {
        path: '/instructors/availability',
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

  async updateAvailability(payload: UpdateAvailabilityPayload) {
    return this.httpClient.callNoError<Array<AvailabilityApiItem>, object, InstructorAvailability>(
      {
        path: '/instructors/availability',
        method: 'POST',
        data: {
          slots: payload.slots.map(slot => ({
            day_of_week: INDEX_TO_DAY[slot.day_of_week],
            start_time: slot.start_time,
            end_time: slot.end_time,
          })),
        },
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

  async getClassRosterStudentProfile(classId: string, userId: string) {
    return this.httpClient.callNoError<InstructorStudentProfile>({
      path: `/instructors/classes/${classId}/roster/${userId}`,
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

  async getUpcomingWeek(fromWeek?: string) {
    return this.httpClient.callNoError<UpcomingWeekResponse>({
      path: '/instructors/schedules/upcoming-week',
      method: 'GET',
      params: {
        ...(fromWeek ? { from: fromWeek } : {}),
      },
    });
  }

  private async getCertificationUploadUrl(payload: InstructorCertificationUploadRequest) {
    return this.httpClient.callNoError<InstructorCertificationPresignedUpload, InstructorCertificationUploadRequest>({
      path: '/instructors/certifications/upload-url',
      method: 'POST',
      data: payload,
    });
  }

  async uploadCertificationDocument(file: File) {
    const { data } = await this.getCertificationUploadUrl({
      content_type: file.type as InstructorCertificationContentType,
    });

    if (!data?.upload_url || !data.file_key) {
      throw new Error('Failed to get instructor certification upload url');
    }

    const uploadResponse = await fetch(data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload instructor certification document');
    }

    return data.file_key;
  }

  async listCertifications() {
    return this.httpClient.callNoError<Array<InstructorCertification>>({
      path: '/instructors/certifications',
      method: 'GET',
    });
  }

  async createCertification(payload: CreateInstructorCertificationPayload) {
    return this.httpClient.callNoError<InstructorCertification, CreateInstructorCertificationPayload>({
      path: '/instructors/certifications',
      method: 'POST',
      data: payload,
    });
  }
}
