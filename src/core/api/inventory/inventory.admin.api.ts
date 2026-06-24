import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  ClassDefinition,
  CreateClassDefinitionPayload,
  CreateRoomPayload,
  GetClassesParams,
  GetRoomsParams,
  Room,
  UpdateClassDefinitionPayload,
  UpdateRoomPayload,
} from './inventory.models';

export class InventoryAdminApi {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getRooms(payload?: GetRoomsParams) {
    return this.httpClient.callNoError<Array<Room>>({
      path: '/admin/rooms',
      method: 'GET',
      params: payload,
    });
  }

  async createRoom(payload: CreateRoomPayload) {
    return this.httpClient.callNoError<Room, CreateRoomPayload>({
      path: '/admin/rooms',
      method: 'POST',
      data: payload,
    });
  }

  async updateRoom(id: string, payload: UpdateRoomPayload) {
    return this.httpClient.callNoError<Room, UpdateRoomPayload>({
      path: `/admin/rooms/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async reactivateRoom(id: string) {
    return this.httpClient.callNoError<Room>({
      path: `/admin/rooms/${id}/reactivate`,
      method: 'POST',
    });
  }

  async deleteRoom(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/rooms/${id}/deactivate`,
      method: 'POST',
    });
  }

  async getClasses(payload?: GetClassesParams) {
    return this.httpClient.callNoError<Array<ClassDefinition>>({
      path: '/admin/class-catalog',
      method: 'GET',
      params: payload,
    });
  }

  async createClass(payload: CreateClassDefinitionPayload) {
    return this.httpClient.callNoError<ClassDefinition, CreateClassDefinitionPayload>({
      path: '/admin/class-catalog',
      method: 'POST',
      data: payload,
    });
  }

  async updateClass(id: string, payload: UpdateClassDefinitionPayload) {
    return this.httpClient.callNoError<ClassDefinition, UpdateClassDefinitionPayload>({
      path: `/admin/class-catalog/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async reactivateClass(id: string) {
    return this.httpClient.callNoError<ClassDefinition>({
      path: `/admin/class-catalog/${id}/reactivate`,
      method: 'POST',
    });
  }

  async deleteClass(id: string) {
    return this.httpClient.callNoError({
      path: `/admin/class-catalog/${id}/deactivate`,
      method: 'POST',
    });
  }
}
