import { HttpClient } from 'polpo-http-client';

import type {
  AdminCancelInternalReservedUsePayload,
  AdminListInternalReservedUsesParams,
  AdminListRequestsPayload,
  AdminRejectPayload,
  AvailabilityRule,
  AvailabilityRulePayload,
  InternalReservedUseCreatePayload,
  ListRulesParams,
  RentalRequest,
  UpdateRulePayload,
} from './studio-rental.models';

export class StudioRentalAdminAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async adminListRequests(payload?: AdminListRequestsPayload) {
    return this.httpClient.call<Array<RentalRequest>>({
      path: '/admin/studio-rentals/requests',
      method: 'GET',
      params: payload,
    });
  }

  async adminApproveRequest(id: string) {
    return this.httpClient.call<RentalRequest>({
      path: `/admin/studio-rentals/requests/${id}/approve`,
      method: 'POST',
    });
  }

  async adminRejectRequest(id: string, payload: AdminRejectPayload) {
    return this.httpClient.call<RentalRequest, AdminRejectPayload>({
      path: `/admin/studio-rentals/requests/${id}/reject`,
      method: 'POST',
      data: payload,
    });
  }

  async adminListInternalReservedUses(payload?: AdminListInternalReservedUsesParams) {
    return this.httpClient.call<Array<RentalRequest>>({
      path: '/admin/studio-rentals/internal-reserved-uses',
      method: 'GET',
      params: payload,
    });
  }

  async adminCreateInternalReservedUse(payload: InternalReservedUseCreatePayload) {
    return this.httpClient.call<RentalRequest, InternalReservedUseCreatePayload>({
      path: '/admin/studio-rentals/internal-reserved-uses',
      method: 'POST',
      data: payload,
    });
  }

  async adminCancelInternalReservedUse(id: string, payload?: AdminCancelInternalReservedUsePayload) {
    return this.httpClient.call<RentalRequest, AdminCancelInternalReservedUsePayload>({
      path: `/admin/studio-rentals/internal-reserved-uses/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }

  async listRules(payload: ListRulesParams) {
    return this.httpClient.call<Array<AvailabilityRule>>({
      path: '/admin/studio-rentals/rules',
      method: 'GET',
      params: payload,
    });
  }

  async createRule(payload: AvailabilityRulePayload) {
    return this.httpClient.call<AvailabilityRule, AvailabilityRulePayload>({
      path: '/admin/studio-rentals/rules',
      method: 'POST',
      data: payload,
    });
  }

  async updateRule(id: string, payload: UpdateRulePayload) {
    return this.httpClient.call<AvailabilityRule, UpdateRulePayload>({
      path: `/admin/studio-rentals/rules/${id}`,
      method: 'PUT',
      data: payload,
    });
  }

  async deleteRule(id: string) {
    return this.httpClient.call({
      path: `/admin/studio-rentals/rules/${id}`,
      method: 'DELETE',
    });
  }
}
