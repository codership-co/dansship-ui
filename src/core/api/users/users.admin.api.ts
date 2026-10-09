import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminEmailLookupResponse,
  AdminRegisterUserPayload,
  AdminRegisterUserResponse,
  InPersonPlanPreview,
  InPersonPlanPurchasePayload,
  InPersonPlanPurchaseResponse,
  AdminUpdateOnboardingPayload,
  AdminUserDetailsResponse,
  TemporaryPasswordResponse,
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

  async lookupByEmail(email: string) {
    return this.httpClient.callNoError<AdminEmailLookupResponse>({
      path: '/admin/users/by-email',
      method: 'GET',
      params: { email },
    });
  }

  async registerUser(payload: AdminRegisterUserPayload) {
    return this.httpClient.callNoError<AdminRegisterUserResponse>({
      path: '/admin/users',
      method: 'POST',
      data: payload,
    });
  }

  async updateOnboarding(userId: string, payload: AdminUpdateOnboardingPayload) {
    return this.httpClient.callNoError<AdminUserDetailsResponse>({
      path: `/admin/users/${userId}/onboarding`,
      method: 'PATCH',
      data: payload,
    });
  }

  async previewPlanPurchase(userId: string, payload: InPersonPlanPurchasePayload) {
    return this.httpClient.callNoError<InPersonPlanPreview>({
      path: `/admin/users/${userId}/plan-purchases/preview`,
      method: 'POST',
      data: payload,
    });
  }

  async createPlanPurchase(userId: string, payload: InPersonPlanPurchasePayload) {
    return this.httpClient.callNoError<InPersonPlanPurchaseResponse>({
      path: `/admin/users/${userId}/plan-purchases`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmPlanPurchase(userId: string, intentId: string) {
    return this.httpClient.callNoError<InPersonPlanPurchaseResponse>({
      path: `/admin/users/${userId}/plan-purchases/${intentId}/confirm`,
      method: 'POST',
    });
  }

  async reissueTemporaryPassword(userId: string) {
    return this.httpClient.callNoError<TemporaryPasswordResponse>({
      path: `/admin/users/${userId}/temporary-password`,
      method: 'POST',
    });
  }
}
