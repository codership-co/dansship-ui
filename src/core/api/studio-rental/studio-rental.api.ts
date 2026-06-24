import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  StudioRentalAvailabilitySlot,
  CancelRequestPayload,
  CreateRentalRequestPayload,
  GetAvailabilityParams,
  RentalRequest,
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

  async getAvailability(payload: GetAvailabilityParams) {
    return this.httpClient.callNoError<Array<StudioRentalAvailabilitySlot>>({
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

  async getMyRequests() {
    return this.httpClient.callNoError<Array<RentalRequest>>({
      path: '/studio-rentals/requests/me',
      method: 'GET',
    });
  }

  async getRequestDetail(id: string) {
    return this.httpClient.callNoError<RentalRequest>({
      path: `/studio-rentals/requests/${id}`,
      method: 'GET',
    });
  }

  async confirmRequest(id: string) {
    return this.httpClient.callNoError<RentalRequest>({
      path: `/studio-rentals/requests/${id}/confirm`,
      method: 'POST',
    });
  }

  async cancelRequest(id: string, payload?: CancelRequestPayload) {
    return this.httpClient.callNoError<RentalRequest, CancelRequestPayload>({
      path: `/studio-rentals/requests/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }
}
