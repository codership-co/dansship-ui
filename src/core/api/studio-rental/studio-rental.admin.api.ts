import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminCancelInternalReservedUsePayload,
  AdminListInternalReservedUsesParams,
  AdminListRequestsPayload,
  AdminListSeriesPayload,
  AdminRejectPayload,
  CreateRoomResourcePayload,
  InternalReservedUseCreatePayload,
  ListAvailabilityBlocksParams,
  RentalRequest,
  RentalSeries,
  RoomAvailabilityBlock,
  RoomAvailabilityBlockCreatePayload,
  RoomAvailabilityBlockUpdatePayload,
  RoomResourceOption,
  UpdateRoomResourcePayload,
} from './studio-rental.models';

export class StudioRentalAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async adminListRequests(payload?: AdminListRequestsPayload) {
    return this.httpClient.callNoError<Array<RentalRequest>>({
      path: '/admin/studio-rentals/requests',
      method: 'GET',
      params: payload,
    });
  }

  async adminListSeries(payload?: AdminListSeriesPayload) {
    return this.httpClient.callNoError<Array<RentalSeries>>({
      path: '/admin/studio-rentals/series',
      method: 'GET',
      params: payload,
    });
  }

  async adminApproveRequest(id: string) {
    return this.httpClient.callNoError<RentalRequest>({
      path: `/admin/studio-rentals/requests/${id}/approve`,
      method: 'POST',
    });
  }

  async adminRejectRequest(id: string, payload: AdminRejectPayload) {
    return this.httpClient.callNoError<RentalRequest, AdminRejectPayload>({
      path: `/admin/studio-rentals/requests/${id}/reject`,
      method: 'POST',
      data: payload,
    });
  }

  async adminApproveSeries(id: string) {
    return this.httpClient.callNoError<RentalSeries>({
      path: `/admin/studio-rentals/series/${id}/approve`,
      method: 'POST',
    });
  }

  async adminRejectSeries(id: string, payload: AdminRejectPayload) {
    return this.httpClient.callNoError<RentalSeries, AdminRejectPayload>({
      path: `/admin/studio-rentals/series/${id}/reject`,
      method: 'POST',
      data: payload,
    });
  }

  async adminListInternalReservedUses(payload?: AdminListInternalReservedUsesParams) {
    return this.httpClient.callNoError<Array<RentalRequest>>({
      path: '/admin/studio-rentals/internal-reserved-uses',
      method: 'GET',
      params: payload,
    });
  }

  async adminCreateInternalReservedUse(payload: InternalReservedUseCreatePayload) {
    return this.httpClient.callNoError<RentalRequest, InternalReservedUseCreatePayload>({
      path: '/admin/studio-rentals/internal-reserved-uses',
      method: 'POST',
      data: payload,
    });
  }

  async adminCancelInternalReservedUse(id: string, payload?: AdminCancelInternalReservedUsePayload) {
    return this.httpClient.callNoError<RentalRequest, AdminCancelInternalReservedUsePayload>({
      path: `/admin/studio-rentals/internal-reserved-uses/${id}/cancel`,
      method: 'POST',
      data: payload,
    });
  }

  async listAvailabilityBlocks(payload: ListAvailabilityBlocksParams) {
    return this.httpClient.callNoError<Array<RoomAvailabilityBlock>>({
      path: '/admin/studio-rentals/availability-blocks',
      method: 'GET',
      params: payload,
    });
  }

  async createAvailabilityBlock(payload: RoomAvailabilityBlockCreatePayload) {
    return this.httpClient.callNoError<RoomAvailabilityBlock, RoomAvailabilityBlockCreatePayload>({
      path: '/admin/studio-rentals/availability-blocks',
      method: 'POST',
      data: payload,
    });
  }

  async updateAvailabilityBlock(id: string, payload: RoomAvailabilityBlockUpdatePayload) {
    return this.httpClient.callNoError<RoomAvailabilityBlock, RoomAvailabilityBlockUpdatePayload>({
      path: `/admin/studio-rentals/availability-blocks/${id}`,
      method: 'PUT',
      data: payload,
    });
  }

  async deleteAvailabilityBlock(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/studio-rentals/availability-blocks/${id}`,
      method: 'DELETE',
    });
  }

  async createRoomResource(roomId: string, payload: CreateRoomResourcePayload) {
    return this.httpClient.callNoError<RoomResourceOption, CreateRoomResourcePayload>({
      path: `/admin/studio-rentals/rooms/${roomId}/resources`,
      method: 'POST',
      data: payload,
    });
  }

  async updateRoomResource(id: string, payload: UpdateRoomResourcePayload) {
    return this.httpClient.callNoError<RoomResourceOption, UpdateRoomResourcePayload>({
      path: `/admin/studio-rentals/resources/${id}`,
      method: 'PUT',
      data: payload,
    });
  }

  async deleteRoomResource(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/studio-rentals/resources/${id}`,
      method: 'DELETE',
    });
  }
}
