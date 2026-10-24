import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminFamilyView,
  BookingPayer,
  CreateMinorPayload,
  CreateMinorResponse,
  FamilyListResponse,
  ManagedUsersPolicy,
  MinorSummary,
} from './family.models';

export class FamilyAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listMine() {
    return this.httpClient.callNoError<FamilyListResponse>({
      path: '/me/minors',
      method: 'GET',
    });
  }

  async createMinor(payload: CreateMinorPayload) {
    return this.httpClient.callNoError<CreateMinorResponse, CreateMinorPayload>({
      path: '/me/minors',
      method: 'POST',
      data: payload,
    });
  }

  async updateMinor(minorId: string, payload: Partial<CreateMinorPayload>) {
    return this.httpClient.callNoError<MinorSummary, Partial<CreateMinorPayload>>({
      path: `/me/minors/${minorId}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async getPolicy() {
    return this.httpClient.callNoError<ManagedUsersPolicy>({
      path: '/legal/managed-users-policy',
      method: 'GET',
    });
  }

  async getBookingPayer(attendeeUserId: string) {
    return this.httpClient.callNoError<BookingPayer>({
      path: '/me/booking-payer',
      method: 'GET',
      params: { attendee_user_id: attendeeUserId },
    });
  }

  async getAdminFamily(userId: string) {
    return this.httpClient.callNoError<AdminFamilyView>({
      path: `/admin/users/${userId}/family`,
      method: 'GET',
    });
  }

  async approveRequest(requestId: string, reason: string) {
    return this.httpClient.callNoError<{ status: string; minor_user_id: string }, { reason: string }>({
      path: `/admin/minor-registration-requests/${requestId}/approve`,
      method: 'POST',
      data: { reason },
    });
  }

  async rejectRequest(requestId: string, reason: string) {
    return this.httpClient.callNoError<{ status: string; id: string }, { reason: string }>({
      path: `/admin/minor-registration-requests/${requestId}/reject`,
      method: 'POST',
      data: { reason },
    });
  }

  async requestTransfer(minorId: string, email: string, reason: string) {
    return this.httpClient.callNoError<{ status: string; id: string }, { email: string; reason: string }>({
      path: `/admin/users/${minorId}/guardian-transfer`,
      method: 'POST',
      data: { email, reason },
    });
  }

  async deactivateMinor(minorId: string, reason: string) {
    return this.httpClient.callNoError<{ status: string }, { reason: string }>({
      path: `/admin/users/${minorId}/deactivate`,
      method: 'POST',
      data: { reason },
    });
  }

  async updateIdentity(
    minorId: string,
    payload: { reason: string; document_type?: string; document_value?: string; birth_date?: string },
  ) {
    return this.httpClient.callNoError<MinorSummary, typeof payload>({
      path: `/admin/users/${minorId}/identity`,
      method: 'PATCH',
      data: payload,
    });
  }
}
