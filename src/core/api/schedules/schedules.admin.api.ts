import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AddClassPayload,
  AgendaEvent,
  CancelPublishedClassPayload,
  CopyWeekPayload,
  EditPublishedClassPayload,
  GetAgendaEventsPayload,
  GetWeeksPayload,
  InstructorClassesResponse,
  ScheduledClass,
  ScheduleWeek,
  UpdateClassPayload,
} from './schedules.models';

export class SchedulesAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getInstructorClasses(userId: string) {
    return this.httpClient.callNoError<InstructorClassesResponse>({
      path: `/admin/schedules/instructors/${userId}/classes`,
      method: 'GET',
    });
  }

  async getWeeks(payload: GetWeeksPayload = {}) {
    return this.httpClient.callNoError<Array<ScheduleWeek>>({
      path: '/admin/schedules/weeks',
      method: 'GET',
      params: payload,
    });
  }

  async getWeekDetail(id: string) {
    return this.httpClient.callNoError<ScheduleWeek>({
      path: `/admin/schedules/weeks/${id}`,
      method: 'GET',
    });
  }

  async getAgendaEvents(payload: GetAgendaEventsPayload) {
    return this.httpClient.callNoError<Array<AgendaEvent>>({
      path: '/admin/agenda/events',
      method: 'GET',
      params: payload,
    });
  }

  async publishWeek(weekId: string) {
    return this.httpClient.callNoError<ScheduleWeek>({
      path: `/admin/schedules/weeks/${weekId}/publish`,
      method: 'POST',
    });
  }

  async archiveWeek(weekId: string) {
    return this.httpClient.callNoError<ScheduleWeek>({
      path: `/admin/schedules/weeks/${weekId}/archive`,
      method: 'POST',
    });
  }

  async copyWeek(payload: CopyWeekPayload) {
    return this.httpClient.callNoError<ScheduleWeek, CopyWeekPayload>({
      path: '/admin/schedules/weeks/copy',
      method: 'POST',
      data: payload,
    });
  }

  async addClass(payload: AddClassPayload) {
    return this.httpClient.callNoError<ScheduledClass, AddClassPayload>({
      path: '/admin/schedules/classes',
      method: 'POST',
      data: payload,
    });
  }

  async updateClass(weekId: string, classId: string, payload: UpdateClassPayload) {
    return this.httpClient.callNoError<ScheduledClass, UpdateClassPayload>({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async removeClass(weekId: string, classId: string) {
    return this.httpClient.callNoError({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}`,
      method: 'DELETE',
    });
  }

  async editPublishedClass(weekId: string, classId: string, payload: EditPublishedClassPayload) {
    return this.httpClient.callNoError<ScheduledClass, EditPublishedClassPayload>({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}/published-edit`,
      method: 'PUT',
      data: payload,
    });
  }

  async cancelPublishedClass(weekId: string, classId: string, payload: CancelPublishedClassPayload = {}) {
    return this.httpClient.callNoError<ScheduledClass, CancelPublishedClassPayload>({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}/published-cancel`,
      method: 'POST',
      data: payload,
    });
  }
}
