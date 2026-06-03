import { HttpClient } from 'polpo-http-client';

import { transformAdminFigure } from './figures.helpers';

import type {
  AdminFigure,
  ConfirmAdminFigureImagePayload,
  FigureAdminCreatePayload,
  FigureAdminListResponse,
  FigureAdminUpdatePayload,
  FigureBulkImportResponse,
  FigureImageUploadUrlRequest,
  FigureImageUploadUrlResponse,
  GetAdminFiguresParams,
  TFigureId,
} from './figures.models';

export class FiguresAdminAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getAdminFigures(payload?: GetAdminFiguresParams) {
    return this.httpClient.call<FigureAdminListResponse>(
      {
        path: '/admin/figures',
        method: 'GET',
        params: payload,
      },
      response => ({
        ...response,
        data: response.data.map(transformAdminFigure),
      }),
    );
  }

  async getAdminFigure(id: TFigureId) {
    return this.httpClient.call<AdminFigure>(
      {
        path: `/admin/figures/${id}`,
        method: 'GET',
      },
      transformAdminFigure,
    );
  }

  async createAdminFigure(payload: FigureAdminCreatePayload) {
    return this.httpClient.call<AdminFigure, FigureAdminCreatePayload>(
      {
        path: '/admin/figures',
        method: 'POST',
        data: payload,
      },
      transformAdminFigure,
    );
  }

  async updateAdminFigure(id: TFigureId, payload: FigureAdminUpdatePayload) {
    return this.httpClient.call<AdminFigure, FigureAdminUpdatePayload>(
      {
        path: `/admin/figures/${id}`,
        method: 'PATCH',
        data: payload,
      },
      transformAdminFigure,
    );
  }

  async deleteAdminFigure(id: TFigureId) {
    return this.httpClient.call({
      path: `/admin/figures/${id}`,
      method: 'DELETE',
    });
  }

  async approveAdminFigure(id: TFigureId) {
    return this.httpClient.call<AdminFigure>(
      {
        path: `/admin/figures/${id}/approve`,
        method: 'POST',
      },
      transformAdminFigure,
    );
  }

  async getAdminFigureImageUploadUrl(id: TFigureId, payload: FigureImageUploadUrlRequest) {
    return this.httpClient.call<FigureImageUploadUrlResponse, FigureImageUploadUrlRequest>({
      path: `/admin/figures/${id}/images/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmAdminFigureImage(id: TFigureId, payload: ConfirmAdminFigureImagePayload) {
    return this.httpClient.call<AdminFigure, ConfirmAdminFigureImagePayload>(
      {
        path: `/admin/figures/${id}/images/confirm`,
        method: 'POST',
        data: payload,
      },
      transformAdminFigure,
    );
  }

  async uploadAdminFigureImage(id: TFigureId, file: File) {
    const response = await this.getAdminFigureImageUploadUrl(id, {
      content_type: file.type,
    });

    if (response.data) {
      const { upload_url, file_key } = response.data;
      const uploadResponse = await this.httpClient.call({
        url: upload_url,
        method: 'PUT',
        data: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.status === 200) {
        return this.confirmAdminFigureImage(id, { file_key });
      }
    }
  }

  async deleteAdminFigureImage(id: TFigureId, fileKey: string) {
    return this.httpClient.call<AdminFigure>(
      {
        path: `/admin/figures/${id}/images/${encodeURIComponent(fileKey)}`,
        method: 'DELETE',
      },
      transformAdminFigure,
    );
  }

  async importAdminFiguresCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.call<FigureBulkImportResponse, FormData>({
      path: '/admin/figures/import',
      method: 'POST',
      data: formData,
      headers: {
        'content-type': undefined,
      },
    });
  }
}
