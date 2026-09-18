import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminUserWorkshopRegistration,
  AdminWorkshopListItem,
  ComboAdmin,
  ComboCreatePayload,
  ComboUpdatePayload,
  PriceConditionCatalogItem,
  WorkshopAdmin,
  WorkshopCreatePayload,
  WorkshopImageConfirmRequest,
  WorkshopImageUploadRequest,
  WorkshopImageUploadResponse,
  WorkshopLanding,
  WorkshopRosterEntry,
  WorkshopUpdatePayload,
} from './talleres.models';

export class TalleresAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async list() {
    return this.httpClient.callNoError<Array<AdminWorkshopListItem>>({
      path: '/admin/workshops',
      method: 'GET',
    });
  }

  async listPriceConditions() {
    return this.httpClient.callNoError<Array<PriceConditionCatalogItem>>({
      path: '/admin/workshops/price-tier-conditions',
      method: 'GET',
    });
  }

  async preview(slug: string) {
    return this.httpClient.callNoError<WorkshopLanding>({
      path: `/admin/workshops/preview/${slug}`,
      method: 'GET',
    });
  }

  async createWorkshop(payload: WorkshopCreatePayload) {
    return this.httpClient.callNoError<WorkshopAdmin, WorkshopCreatePayload>({
      path: '/admin/workshops',
      method: 'POST',
      data: payload,
    });
  }

  async getWorkshop(id: string) {
    return this.httpClient.callNoError<WorkshopAdmin>({
      path: `/admin/workshops/${id}`,
      method: 'GET',
    });
  }

  async updateWorkshop(id: string, payload: WorkshopUpdatePayload) {
    return this.httpClient.callNoError<WorkshopAdmin, WorkshopUpdatePayload>({
      path: `/admin/workshops/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async listRoster(id: string) {
    return this.httpClient.callNoError<Array<WorkshopRosterEntry>>({
      path: `/admin/workshops/${id}/roster`,
      method: 'GET',
    });
  }

  async listUserRegistrations(userId: string) {
    return this.httpClient.callNoError<Array<AdminUserWorkshopRegistration>>({
      path: '/admin/workshops/registrations',
      method: 'GET',
      params: { user_id: userId },
    });
  }

  async createCombo(payload: ComboCreatePayload) {
    return this.httpClient.callNoError<ComboAdmin, ComboCreatePayload>({
      path: '/admin/workshops/combos',
      method: 'POST',
      data: payload,
    });
  }

  async getCombo(id: string) {
    return this.httpClient.callNoError<ComboAdmin>({
      path: `/admin/workshops/combos/${id}`,
      method: 'GET',
    });
  }

  async updateCombo(id: string, payload: ComboUpdatePayload) {
    return this.httpClient.callNoError<ComboAdmin, ComboUpdatePayload>({
      path: `/admin/workshops/combos/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async getComboImageUploadUrl(id: string, payload: WorkshopImageUploadRequest) {
    return this.httpClient.callNoError<WorkshopImageUploadResponse, WorkshopImageUploadRequest>({
      path: `/admin/workshops/combos/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmComboImageUpload(id: string, payload: WorkshopImageConfirmRequest) {
    return this.httpClient.callNoError<ComboAdmin, WorkshopImageConfirmRequest>({
      path: `/admin/workshops/combos/${id}/image/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadComboImage(id: string, file: File) {
    const response = await this.getComboImageUploadUrl(id, {
      content_type: file.type as WorkshopImageUploadRequest['content_type'],
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
      throw new Error('WORKSHOP_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmComboImageUpload(id, { file_key });
  }

  async getImageUploadUrl(id: string, payload: WorkshopImageUploadRequest) {
    return this.httpClient.callNoError<WorkshopImageUploadResponse, WorkshopImageUploadRequest>({
      path: `/admin/workshops/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmImageUpload(id: string, payload: WorkshopImageConfirmRequest) {
    return this.httpClient.callNoError<WorkshopAdmin, WorkshopImageConfirmRequest>({
      path: `/admin/workshops/${id}/image/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadImage(id: string, file: File) {
    const response = await this.getImageUploadUrl(id, {
      content_type: file.type as WorkshopImageUploadRequest['content_type'],
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
      throw new Error('WORKSHOP_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmImageUpload(id, { file_key });
  }
}
