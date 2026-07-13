import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { AdminUserDetailsResponse, UserResponse, UsersSearchParams } from './users.models';

export class UsersAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async search(payload?: UsersSearchParams) {
    return this.httpClient.callNoError<Array<UserResponse>>({
      path: '/admin/users',
      method: 'GET',
      params: payload,
    });
  }

  async getById(userId: string) {
    return this.httpClient.callNoError<AdminUserDetailsResponse>({
      path: `/admin/users/${userId}`,
      method: 'GET',
    });
  }
}
