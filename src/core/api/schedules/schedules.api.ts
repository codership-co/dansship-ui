import { HttpClient } from 'polpo-http-client';

import type {
  AddClassPayload,
  AgendaEvent,
  CreateWeekPayload,
  EditPublishedClassPayload,
  GetAgendaEventsPayload,
  GetWaitlistDefaultResponse,
  GetWeeksPayload,
  ScheduledClass,
  ScheduleWeek,
  UpdateClassPayload,
  UpdateWaitlistConfigPayload,
} from './schedules.models';
import type { PublishedClass } from '../bookings/bookings.models';

export class SchedulesAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getWeeks(payload: GetWeeksPayload) {
    return this.httpClient.call<Array<ScheduleWeek>>({
      path: '/admin/schedules/weeks',
      method: 'GET',
      params: payload,
    });
  }

  async getWeekDetail(id: string) {
    return this.httpClient.call<ScheduleWeek>({
      path: `/admin/schedules/weeks/${id}`,
      method: 'GET',
    });
  }

  async getAgendaEvents(payload: GetAgendaEventsPayload) {
    return this.httpClient.call<Array<AgendaEvent>>({
      path: '/admin/agenda/events',
      method: 'GET',
      params: payload,
    });
  }

  async createWeek(payload: CreateWeekPayload) {
    return this.httpClient.call<ScheduleWeek, CreateWeekPayload>({
      path: '/admin/schedules/weeks',
      method: 'POST',
      data: payload,
    });
  }

  async publishWeek(weekId: string) {
    return this.httpClient.call<ScheduleWeek>({
      path: `/admin/schedules/weeks/${weekId}/publish`,
      method: 'POST',
    });
  }

  async archiveWeek(weekId: string) {
    return this.httpClient.call<ScheduleWeek>({
      path: `/admin/schedules/weeks/${weekId}/archive`,
      method: 'POST',
    });
  }

  async addClass(payload: AddClassPayload) {
    return this.httpClient.call<ScheduledClass, AddClassPayload>({
      path: '/admin/schedules/classes',
      method: 'POST',
      data: payload,
    });
  }

  async updateClass(weekId: string, classId: string, payload: UpdateClassPayload) {
    return this.httpClient.call<ScheduledClass, UpdateClassPayload>({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async updateWaitlistConfig(classId: string, payload: UpdateWaitlistConfigPayload) {
    return this.httpClient.call<ScheduledClass, UpdateWaitlistConfigPayload>({
      path: `/admin/schedules/classes/${classId}/waitlist-config`,
      method: 'PUT',
      data: payload,
    });
  }

  async getWaitlistDefault() {
    return this.httpClient.call<GetWaitlistDefaultResponse>({
      path: '/admin/settings/waitlist-default',
      method: 'GET',
    });
  }

  async removeClass(weekId: string, classId: string) {
    return this.httpClient.call({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}`,
      method: 'DELETE',
    });
  }

  async editPublishedClass(weekId: string, classId: string, payload: EditPublishedClassPayload) {
    return this.httpClient.call<ScheduledClass, EditPublishedClassPayload>({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}/published-edit`,
      method: 'PUT',
      data: payload,
    });
  }

  async cancelPublishedClass(weekId: string, classId: string) {
    return this.httpClient.call({
      path: `/admin/schedules/weeks/${weekId}/classes/${classId}/published-cancel`,
      method: 'DELETE',
    });
  }

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
