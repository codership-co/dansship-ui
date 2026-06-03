import { HttpClient } from 'polpo-http-client';

import type { UserResponse, UsersSearchParams } from './users.models';

export class UsersAdminAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async search(payload: UsersSearchParams) {
    return this.httpClient.call<UserResponse>({
      path: '/admin/users',
      method: 'GET',
      params: payload,
    });
  }
}
