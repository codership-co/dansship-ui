import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AssignPolicyToRolePayload,
  AssignRoleToUserPayload,
  PolicyCreatePayload,
  PolicyResponse,
  PolicyUpdatePayload,
  RoleDetailResponse,
  RoleResponse,
  UserWithRolesResponse,
} from './rbac.models';

export class RbacAdminApi {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getRoles() {
    return this.httpClient.callNoError<Array<RoleResponse>>({
      path: '/admin/rbac/roles',
      method: 'GET',
    });
  }

  async getRoleDetail(roleId: string) {
    return this.httpClient.callNoError<RoleDetailResponse>({
      path: `/admin/rbac/roles/${roleId}`,
      method: 'GET',
    });
  }

  async assignPolicyToRole(roleId: string, payload: AssignPolicyToRolePayload) {
    return this.httpClient.callNoError<RoleDetailResponse, AssignPolicyToRolePayload>({
      path: `/admin/rbac/roles/${roleId}/policies`,
      method: 'POST',
      data: payload,
    });
  }

  async revokePolicyFromRole(roleId: string, policyId: string) {
    return this.httpClient.callNoError<RoleDetailResponse>({
      path: `/admin/rbac/roles/${roleId}/policies/${policyId}`,
      method: 'DELETE',
    });
  }

  async getPolicies() {
    return this.httpClient.callNoError<Array<PolicyResponse>>({
      path: '/admin/rbac/policies',
      method: 'GET',
    });
  }

  async getPolicyDetail(policyId: string) {
    return this.httpClient.callNoError<PolicyResponse>({
      path: `/admin/rbac/policies/${policyId}`,
      method: 'GET',
    });
  }

  async createPolicy(payload: PolicyCreatePayload) {
    return this.httpClient.callNoError<PolicyResponse, PolicyCreatePayload>({
      path: '/admin/rbac/policies',
      method: 'POST',
      data: payload,
    });
  }

  async updatePolicy(policyId: string, payload: PolicyUpdatePayload) {
    return this.httpClient.callNoError<PolicyResponse, PolicyUpdatePayload>({
      path: `/admin/rbac/policies/${policyId}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async deletePolicy(policyId: string) {
    return this.httpClient.callNoError({
      path: `/admin/rbac/policies/${policyId}`,
      method: 'DELETE',
    });
  }

  async getUserRoles(userId: string) {
    return this.httpClient.callNoError<UserWithRolesResponse>({
      path: `/admin/rbac/users/${userId}/roles`,
      method: 'GET',
    });
  }

  async assignRoleToUser(userId: string, payload: AssignRoleToUserPayload) {
    return this.httpClient.callNoError<UserWithRolesResponse, AssignRoleToUserPayload>({
      path: `/admin/rbac/users/${userId}/roles`,
      method: 'POST',
      data: payload,
    });
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    return this.httpClient.callNoError<UserWithRolesResponse>({
      path: `/admin/rbac/users/${userId}/roles/${roleId}`,
      method: 'DELETE',
    });
  }
}
