import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { RbacRole, UserWithRolesResponse } from './rbac.models';

export class RbacAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listRoles() {
    return this.httpClient.callNoError<Array<RbacRole>>({
      path: '/admin/rbac/roles',
      method: 'GET',
    });
  }

  async getUserRoles(userId: string) {
    return this.httpClient.callNoError<UserWithRolesResponse>({
      path: `/admin/rbac/users/${userId}/roles`,
      method: 'GET',
    });
  }

  async assignRole(userId: string, roleId: string) {
    return this.httpClient.callNoError<UserWithRolesResponse, { role_id: string }>({
      path: `/admin/rbac/users/${userId}/roles`,
      method: 'POST',
      data: { role_id: roleId },
    });
  }

  async revokeRole(userId: string, roleId: string) {
    return this.httpClient.callNoError<UserWithRolesResponse>({
      path: `/admin/rbac/users/${userId}/roles/${roleId}`,
      method: 'DELETE',
    });
  }
}
