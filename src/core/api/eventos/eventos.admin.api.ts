import { HttpClient } from 'polpo-http-client';

import { putFileToPresignedUrl } from '../common/put-file-to-presigned-url';

import { DansshipAPIError } from '@core/api';

import type {
  AdminUserEventRegistration,
  AdminEventListItem,
  ComboAdmin,
  ComboCreatePayload,
  ComboUpdatePayload,
  DirectRegistrationPayload,
  PartnerLookupResponse,
  PriceConditionCatalogItem,
  EventAdmin,
  EventCreatePayload,
  EventImageConfirmRequest,
  EventImageUploadRequest,
  EventImageUploadResponse,
  EventInvite,
  EventLanding,
  EventRosterEntry,
  EventSession,
  EventUpdatePayload,
  RecurrencePreview,
  InstallmentProofContentType,
  InstallmentQuote,
  ManualInstallmentConfirmPayload,
  ManualInstallmentPaymentResult,
} from './eventos.models';

export class EventosAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async list() {
    return this.httpClient.callNoError<Array<AdminEventListItem>>({
      path: '/admin/events',
      method: 'GET',
    });
  }

  async listPriceConditions() {
    return this.httpClient.callNoError<Array<PriceConditionCatalogItem>>({
      path: '/admin/events/price-tier-conditions',
      method: 'GET',
    });
  }

  async preview(slug: string) {
    return this.httpClient.callNoError<EventLanding>({
      path: `/admin/events/preview/${slug}`,
      method: 'GET',
    });
  }

  async createEvent(payload: EventCreatePayload) {
    return this.httpClient.callNoError<EventAdmin, EventCreatePayload>({
      path: '/admin/events',
      method: 'POST',
      data: payload,
    });
  }

  async getEvent(id: string) {
    return this.httpClient.callNoError<EventAdmin>({
      path: `/admin/events/${id}`,
      method: 'GET',
    });
  }

  async updateEvent(id: string, payload: EventUpdatePayload) {
    return this.httpClient.callNoError<EventAdmin, EventUpdatePayload>({
      path: `/admin/events/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async listRoster(id: string) {
    return this.httpClient.callNoError<Array<EventRosterEntry>>({
      path: `/admin/events/${id}/roster`,
      method: 'GET',
    });
  }

  async quoteInstallments(eventId: string, userId: string) {
    return this.httpClient.callNoError<InstallmentQuote>({
      path: `/admin/events/${eventId}/installment-quote`,
      method: 'GET',
      params: { user_id: userId },
    });
  }

  async presignInstallmentProof(contentType: InstallmentProofContentType) {
    return this.httpClient.callNoError<{ upload_url: string; file_key: string }>({
      path: '/admin/events/installment-proofs/upload-url',
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  async confirmInstallmentPayment(eventId: string, payload: ManualInstallmentConfirmPayload) {
    return this.httpClient.callNoError<ManualInstallmentPaymentResult, ManualInstallmentConfirmPayload>({
      path: `/admin/events/${eventId}/installment-payments`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadInstallmentProof(file: File) {
    const presign = await this.presignInstallmentProof(file.type as InstallmentProofContentType);

    if (!presign.data?.upload_url || !presign.data.file_key) {
      return presign;
    }

    await putFileToPresignedUrl(file, presign.data.upload_url, { contentType: file.type });

    return presign;
  }

  async withdrawRegistrant(eventId: string, registrationId: string) {
    return this.httpClient.callNoError<EventRosterEntry>({
      path: `/admin/events/${eventId}/registrations/${registrationId}/withdraw`,
      method: 'POST',
    });
  }

  async listUserRegistrations(userId: string) {
    return this.httpClient.callNoError<Array<AdminUserEventRegistration>>({
      path: '/admin/events/registrations',
      method: 'GET',
      params: { user_id: userId },
    });
  }

  async createCombo(payload: ComboCreatePayload) {
    return this.httpClient.callNoError<ComboAdmin, ComboCreatePayload>({
      path: '/admin/events/combos',
      method: 'POST',
      data: payload,
    });
  }

  async getCombo(id: string) {
    return this.httpClient.callNoError<ComboAdmin>({
      path: `/admin/events/combos/${id}`,
      method: 'GET',
    });
  }

  async updateCombo(id: string, payload: ComboUpdatePayload) {
    return this.httpClient.callNoError<ComboAdmin, ComboUpdatePayload>({
      path: `/admin/events/combos/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async getComboImageUploadUrl(id: string, payload: EventImageUploadRequest) {
    return this.httpClient.callNoError<EventImageUploadResponse, EventImageUploadRequest>({
      path: `/admin/events/combos/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmComboImageUpload(id: string, payload: EventImageConfirmRequest) {
    return this.httpClient.callNoError<ComboAdmin, EventImageConfirmRequest>({
      path: `/admin/events/combos/${id}/image/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadComboImage(id: string, file: File) {
    const response = await this.getComboImageUploadUrl(id, {
      content_type: file.type as EventImageUploadRequest['content_type'],
    });

    if (!response.data) {
      return response;
    }

    const { upload_url, file_key } = response.data;
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('EVENT_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmComboImageUpload(id, { file_key });
  }

  async getImageUploadUrl(id: string, payload: EventImageUploadRequest) {
    return this.httpClient.callNoError<EventImageUploadResponse, EventImageUploadRequest>({
      path: `/admin/events/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmImageUpload(id: string, payload: EventImageConfirmRequest) {
    return this.httpClient.callNoError<EventAdmin, EventImageConfirmRequest>({
      path: `/admin/events/${id}/image/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadImage(id: string, file: File) {
    const response = await this.getImageUploadUrl(id, {
      content_type: file.type as EventImageUploadRequest['content_type'],
    });

    if (!response.data) {
      return response;
    }

    const { upload_url, file_key } = response.data;
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('EVENT_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmImageUpload(id, { file_key });
  }

  async lookupCollaborator(email: string) {
    return this.httpClient.callNoError<PartnerLookupResponse>({
      path: '/admin/events/collaborators/lookup',
      method: 'GET',
      params: { email },
    });
  }

  async registerDirectly(id: string, payload: DirectRegistrationPayload) {
    return this.httpClient.callNoError<EventRosterEntry, DirectRegistrationPayload>({
      path: `/admin/events/${id}/registrations`,
      method: 'POST',
      data: payload,
    });
  }

  async getPaymentQrUploadUrl(id: string, payload: EventImageUploadRequest) {
    return this.httpClient.callNoError<EventImageUploadResponse, EventImageUploadRequest>({
      path: `/admin/events/${id}/payment-qr/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmPaymentQr(id: string, payload: EventImageConfirmRequest) {
    return this.httpClient.callNoError<EventAdmin, EventImageConfirmRequest>({
      path: `/admin/events/${id}/payment-qr/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadPaymentQr(id: string, file: File) {
    const response = await this.getPaymentQrUploadUrl(id, {
      content_type: file.type as EventImageUploadRequest['content_type'],
    });

    if (!response.data) {
      return response;
    }

    const { upload_url, file_key } = response.data;
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('EVENT_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmPaymentQr(id, { file_key });
  }

  async listSessions(eventId: string) {
    return this.httpClient.callNoError<Array<EventSession>>({
      path: `/admin/events/${eventId}/sessions`,
      method: 'GET',
    });
  }

  async addSession(
    eventId: string,
    payload: {
      starts_at: string;
      ends_at: string;
      room_id?: string | null;
      external_location?: string | null;
      label?: string | null;
    },
  ) {
    return this.httpClient.callNoError<EventSession>({
      path: `/admin/events/${eventId}/sessions`,
      method: 'POST',
      data: payload,
    });
  }

  async cancelSession(eventId: string, sessionId: string) {
    return this.httpClient.callNoError<EventSession>({
      path: `/admin/events/${eventId}/sessions/${sessionId}/cancel`,
      method: 'POST',
    });
  }

  async previewRecurrence(
    eventId: string,
    payload: {
      weekday: number;
      start_time: string;
      end_time: string;
      first_date: string;
      last_date: string;
      room_id?: string | null;
      external_location?: string | null;
      label?: string | null;
    },
  ) {
    return this.httpClient.callNoError<RecurrencePreview>({
      path: `/admin/events/${eventId}/recurrence/preview`,
      method: 'POST',
      data: payload,
    });
  }

  async applyRecurrence(
    eventId: string,
    payload: {
      weekday: number;
      start_time: string;
      end_time: string;
      first_date: string;
      last_date: string;
      room_id?: string | null;
      external_location?: string | null;
      label?: string | null;
    },
  ) {
    return this.httpClient.callNoError<Array<EventSession>>({
      path: `/admin/events/${eventId}/recurrence`,
      method: 'POST',
      data: payload,
    });
  }

  async setVisibility(eventId: string, visibility: 'public' | 'link_only' | 'invite_only') {
    return this.httpClient.callNoError<EventAdmin>({
      path: `/admin/events/${eventId}/visibility`,
      method: 'PUT',
      data: { visibility },
    });
  }

  async rotateAccessToken(eventId: string) {
    return this.httpClient.callNoError<EventAdmin>({
      path: `/admin/events/${eventId}/access-token/rotate`,
      method: 'POST',
    });
  }

  async listInvites(eventId: string) {
    return this.httpClient.callNoError<Array<EventInvite>>({
      path: `/admin/events/${eventId}/invites`,
      method: 'GET',
    });
  }

  async invite(eventId: string, userId: string) {
    return this.httpClient.callNoError<EventInvite>({
      path: `/admin/events/${eventId}/invites`,
      method: 'POST',
      data: { user_id: userId },
    });
  }

  async uninvite(eventId: string, userId: string) {
    return this.httpClient.callNoError<void>({
      path: `/admin/events/${eventId}/invites/${userId}`,
      method: 'DELETE',
    });
  }
}
