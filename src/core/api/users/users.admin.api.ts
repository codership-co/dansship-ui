import { HttpClient } from 'polpo-http-client';

import type { UserResponse, UsersSearchParams } from './users.models';

export class UsersAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

  async search(payload: UsersSearchParams) {
    return this.httpClient.callNoError<UserResponse>({
      path: '/admin/users',
      method: 'GET',
      params: payload,
    });
  }
}
