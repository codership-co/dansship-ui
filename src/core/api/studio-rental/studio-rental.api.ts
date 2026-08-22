import { HttpClient } from 'polpo-http-client';

import { toNumber } from '../payments/payments.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  CalendarBlock,
  CancelRequestPayload,
  CreateRentalRequestPayload,
  CreateRentalSeriesPayload,
  GetAvailabilityParams,
  GetCalendarParams,
  RentalPaymentResult,
  RentalRequest,
  RentalSeries,
  StudioRentalRoomOption,
} from './studio-rental.models';

export class StudioRentalAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getRooms() {
    return this.httpClient.callNoError<Array<StudioRentalRoomOption>>({
      path: '/studio-rentals/rooms',
      method: 'GET',
    });
  }

  async getRoomCalendar(roomId: string, payload: GetCalendarParams) {
    return this.httpClient.callNoError<Array<CalendarBlock>>({
      path: `/studio-rentals/rooms/${roomId}/calendar`,
      method: 'GET',
      params: payload,
    });
  }

  /** @deprecated Prefer getRoomCalendar */
  async getAvailability(payload: GetAvailabilityParams) {
    return this.httpClient.callNoError<Array<CalendarBlock>>({
      path: '/studio-rentals/availability',
      method: 'GET',
      params: payload,
    });
  }

  async createRequest(payload: CreateRentalRequestPayload) {
    return this.httpClient.callNoError<RentalRequest, CreateRentalRequestPayload>({
      path: '/studio-rentals/requests',
      method: 'POST',
      data: payload,
    });
  }

  async createSeries(payload: CreateRentalSeriesPayload) {
    return this.httpClient.callNoError<RentalSeries, CreateRentalSeriesPayload>({
      path: '/studio-rentals/series',
      method: 'POST',
      data: payload,
    });
  }

  async getMyRequests() {
    return this.httpClient.callNoError<Array<RentalRequest>>({
      path: '/studio-rentals/requests/me',
      method: 'GET',
    });
  }

  async getMySeries() {
    return this.httpClient.callNoError<Array<RentalSeries>>({
      path: '/studio-rentals/series/me',
      method: 'GET',
    });
  }

  async getRequestDetail(id: string) {
    return this.httpClient.callNoError<RentalRequest>({
      path: `/studio-rentals/requests/${id}`,
      method: 'GET',
    });
  }

  async getSeriesDetail(id: string) {
    return this.httpClient.callNoError<RentalSeries>({
      path: `/studio-rentals/series/${id}`,
      method: 'GET',
    });
  }

  async getPaymentResult(intentId: string) {
    return this.httpClient.callNoError<RentalPaymentResult>(
      {
        path: `/studio-rentals/payments/${intentId}`,
        method: 'GET',
      },
      data => ({
        ...data,
        payment: {
          ...data.payment,
          amount: toNumber(data.payment.amount),
          wallet_amount_applied: toNumber(data.payment.wallet_amount_applied),
          tax_rate_percentage:
            data.payment.tax_rate_percentage === null || data.payment.tax_rate_percentage === undefined
              ? null
              : toNumber(data.payment.tax_rate_percentage),
          tax_amount:
            data.payment.tax_amount === null || data.payment.tax_amount === undefined
              ? null
              : toNumber(data.payment.tax_amount),
          base_amount:
            data.payment.base_amount === null || data.payment.base_amount === undefined
              ? null
              : toNumber(data.payment.base_amount),
        },
      }),
    );
  }

  async confirmRequest(id: string) {
    return this.httpClient.callNoError<RentalRequest>({
      path: `/studio-rentals/requests/${id}/confirm`,
      method: 'POST',
    });
  }

  async cancelRequest(id: string, payload?: CancelRequestPayload) {
    return this.httpClient.callNoError<RentalRequest | RentalSeries, CancelRequestPayload>({
      path: `/studio-rentals/requests/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }

  async cancelSeries(id: string, payload?: CancelRequestPayload) {
    return this.httpClient.callNoError<RentalSeries, CancelRequestPayload>({
      path: `/studio-rentals/series/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }
}
