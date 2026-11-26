import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  ClassFeedbackAdminFilters,
  ClassFeedbackAdminReport,
  ClassFeedbackCreatePayload,
  ClassFeedbackItem,
  ClassFeedbackListResponse,
} from './class-feedback.models';

export class ClassFeedbackAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listMine() {
    return this.httpClient.callNoError<ClassFeedbackListResponse>({
      path: '/class-feedback/me',
      method: 'GET',
    });
  }

  async create(payload: ClassFeedbackCreatePayload) {
    return this.httpClient.callNoError<ClassFeedbackItem, ClassFeedbackCreatePayload>({
      path: '/class-feedback',
      method: 'POST',
      data: payload,
    });
  }
}

export class ClassFeedbackAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async list(startDate?: string, endDate?: string, filters: ClassFeedbackAdminFilters = {}) {
    return this.httpClient.callNoError<ClassFeedbackAdminReport>({
      path: '/admin/class-feedback',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
        ...(filters.instructorId ? { instructor_id: filters.instructorId } : {}),
        ...(filters.userId ? { user_id: filters.userId } : {}),
      },
    });
  }
}
