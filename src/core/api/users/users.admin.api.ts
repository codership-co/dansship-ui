import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminUserDetailsResponse,
  UserDeactivateResponse,
  UserListPage,
  UserReactivateResponse,
  UsersSearchParams,
} from './users.models';

export class UsersAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async search(payload?: UsersSearchParams) {
    return this.httpClient.callNoError<UserListPage>({
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

  async deactivateUser(userId: string) {
    return this.httpClient.callNoError<UserDeactivateResponse>({
      path: `/admin/users/${userId}/deactivate`,
      method: 'POST',
    });
  }

  async reactivateUser(userId: string) {
    return this.httpClient.callNoError<UserReactivateResponse>({
      path: `/admin/users/${userId}/reactivate`,
      method: 'POST',
    });
  }
}
