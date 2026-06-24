import { HttpClient } from 'polpo-http-client';

import { transformAdminFigure } from './figures.helpers';

import { DansshipAPIError } from '@core/api';

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
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getAdminFigures(payload?: GetAdminFiguresParams) {
    return this.httpClient.callNoError<FigureAdminListResponse>(
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
    return this.httpClient.callNoError<AdminFigure>(
      {
        path: `/admin/figures/${id}`,
        method: 'GET',
      },
      transformAdminFigure,
    );
  }

  async createAdminFigure(payload: FigureAdminCreatePayload) {
    return this.httpClient.callNoError<AdminFigure, FigureAdminCreatePayload>(
      {
        path: '/admin/figures',
        method: 'POST',
        data: payload,
      },
      transformAdminFigure,
    );
  }

  async updateAdminFigure(id: TFigureId, payload: FigureAdminUpdatePayload) {
    return this.httpClient.callNoError<AdminFigure, FigureAdminUpdatePayload>(
      {
        path: `/admin/figures/${id}`,
        method: 'PATCH',
        data: payload,
      },
      transformAdminFigure,
    );
  }

  async deleteAdminFigure(id: TFigureId) {
    return this.httpClient.callNoError({
      path: `/admin/figures/${id}`,
      method: 'DELETE',
    });
  }

  async approveAdminFigure(id: TFigureId) {
    return this.httpClient.callNoError<AdminFigure>(
      {
        path: `/admin/figures/${id}/approve`,
        method: 'POST',
      },
      transformAdminFigure,
    );
  }

  async getAdminFigureImageUploadUrl(id: TFigureId, payload: FigureImageUploadUrlRequest) {
    return this.httpClient.callNoError<FigureImageUploadUrlResponse, FigureImageUploadUrlRequest>({
      path: `/admin/figures/${id}/images/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmAdminFigureImage(id: TFigureId, payload: ConfirmAdminFigureImagePayload) {
    return this.httpClient.callNoError<AdminFigure, ConfirmAdminFigureImagePayload>(
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
      const uploadResponse = await this.httpClient.callNoError({
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
    return this.httpClient.callNoError<AdminFigure>(
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

    return this.httpClient.callNoError<FigureBulkImportResponse, FormData>({
      path: '/admin/figures/import',
      method: 'POST',
      data: formData,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      headers: {
        'content-type': undefined,
      },
    });
  }
}
