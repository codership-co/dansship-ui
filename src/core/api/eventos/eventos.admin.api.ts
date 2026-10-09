import { HttpClient } from 'polpo-http-client';

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
  EventLanding,
  EventRosterEntry,
  EventUpdatePayload,
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
}
