import { HttpClient } from 'polpo-http-client';

import type {
  StudioRentalAvailabilitySlot,
  CancelRequestPayload,
  CreateRentalRequestPayload,
  GetAvailabilityParams,
  RentalRequest,
  StudioRentalRoomOption,
} from './studio-rental.models';

export class StudioRentalAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getRooms() {
    return this.httpClient.call<Array<StudioRentalRoomOption>>({
      path: '/studio-rentals/rooms',
      method: 'GET',
    });
  }

  async getAvailability(payload: GetAvailabilityParams) {
    return this.httpClient.call<Array<StudioRentalAvailabilitySlot>>({
      path: '/studio-rentals/availability',
      method: 'GET',
      params: payload,
    });
  }

  async createRequest(payload: CreateRentalRequestPayload) {
    return this.httpClient.call<RentalRequest, CreateRentalRequestPayload>({
      path: '/studio-rentals/requests',
      method: 'POST',
      data: payload,
    });
  }

  async getMyRequests() {
    return this.httpClient.call<Array<RentalRequest>>({
      path: '/studio-rentals/requests/me',
      method: 'GET',
    });
  }

  async getRequestDetail(id: string) {
    return this.httpClient.call<RentalRequest>({
      path: `/studio-rentals/requests/${id}`,
      method: 'GET',
    });
  }

  async confirmRequest(id: string) {
    return this.httpClient.call<RentalRequest>({
      path: `/studio-rentals/requests/${id}/confirm`,
      method: 'POST',
    });
  }

  async cancelRequest(id: string, payload?: CancelRequestPayload) {
    return this.httpClient.call<RentalRequest, CancelRequestPayload>({
      path: `/studio-rentals/requests/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }
}
