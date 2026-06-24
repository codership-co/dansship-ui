import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { UserResponse, UsersSearchParams } from './users.models';

export class UsersAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async search(payload: UsersSearchParams) {
    return this.httpClient.callNoError<Array<UserResponse>>({
      path: '/admin/users',
      method: 'GET',
      params: payload,
    });
  }
}
