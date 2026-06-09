import { HttpClient } from 'polpo-http-client';

import { transformFigure } from './figures.helpers';

import type {
  DetailedFigure,
  FavoriteFigureResponse,
  Figure,
  FigureProgress,
  FigureProgressCreateRequest,
  FigureProgressListResponse,
  FigureProgressUpdateRequest,
  GetFigureByIdParams,
  GetFigureProgressParams,
  GetFiguresParams,
  GetFiguresResponse,
  GetSavedFiguresParams,
  SavedFiguresResponse,
  SaveFigurePayload,
  TFigureId,
  UpdateProgressPayload,
} from './figures.models';
import type { OffsetPaginatedResponse } from '../common/common.models';

export class FiguresAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getFigures(payload?: GetFiguresParams) {
    return this.httpClient.call<OffsetPaginatedResponse<Figure>, object, GetFiguresResponse>(
      {
        path: '/figures',
        method: 'GET',
        params: payload,
      },
      response => ({
        figures: response.data.map(transformFigure),
        total: response.total,
      }),
    );
  }

  async getFigureById(id: TFigureId, payload?: GetFigureByIdParams) {
    return this.httpClient.call<Figure, object, DetailedFigure>(
      {
        path: `/figures/${id}`,
        method: 'GET',
        params: payload,
      },
      response => ({
        ...transformFigure(response),
        description: response.description || '',
        prerequisites: [],
        tips: response.tips || [],
        duration: '',
        status: null,
      }),
    );
  }

  async getFigureProgress(id: TFigureId, payload?: GetFigureProgressParams) {
    return this.httpClient.call<FigureProgressListResponse>({
      path: `/figures/${id}/progress`,
      method: 'GET',
      params: {
        ...payload,
        limit: payload?.limit ?? 20,
        offset: payload?.offset ?? 0,
      },
    });
  }

  async createFigureProgress(id: TFigureId, payload: FigureProgressCreateRequest) {
    return this.httpClient.call<FigureProgress, FigureProgressCreateRequest>({
      path: `/figures/${id}/progress`,
      method: 'POST',
      data: payload,
    });
  }

  async updateFigureProgress(figureId: TFigureId, progressId: string, payload: FigureProgressUpdateRequest) {
    return this.httpClient.call<FigureProgress, FigureProgressUpdateRequest>({
      path: `/figures/${figureId}/progress/${progressId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async deleteFigureProgress(figureId: TFigureId, progressId: string) {
    return this.httpClient.call({
      path: `/figures/${figureId}/progress/${progressId}`,
      method: 'DELETE',
    });
  }

  async getSavedFigures(payload?: GetSavedFiguresParams) {
    return this.httpClient.call<SavedFiguresResponse, object, Array<Figure>>(
      {
        path: '/saved-figures',
        method: 'GET',
        params: {
          ...payload,
          limit: payload?.limit ?? 20,
          offset: payload?.offset ?? 0,
        },
      },
      response =>
        response.items.map(item =>
          transformFigure({
            ...item,
            savedAt: item.created_at,
          }),
        ),
    );
  }

  async saveFigure(payload: SaveFigurePayload) {
    return this.httpClient.call<FavoriteFigureResponse, SaveFigurePayload>({
      path: '/saved-figures',
      method: 'POST',
      data: payload,
    });
  }

  async unsaveFigure(figureId: TFigureId) {
    return this.httpClient.call({
      path: `/saved-figures/${figureId}`,
      method: 'DELETE',
    });
  }

  async checkIfSaved(figureId: TFigureId) {
    const response = await this.getSavedFigures({ limit: 100 });

    if (response.data) {
      return response.data.some(item => item.id === figureId);
    }

    return false;
  }

  async updateProgress(figureId: TFigureId, payload: UpdateProgressPayload) {
    return this.httpClient.call<FigureProgress>({
      path: `/figures/${figureId}/progress`,
      method: 'PUT',
      data: payload,
    });
  }

  async getProgress(figureId: TFigureId) {
    return this.httpClient.call<FigureProgress>({
      path: `/figures/${figureId}/progress`,
      method: 'GET',
    });
  }
}
