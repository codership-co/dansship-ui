import { HttpClient } from 'polpo-http-client';

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

export class InventoryAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getRooms(payload?: GetRoomsParams) {
    return this.httpClient.call<Array<Room>>({
      path: '/admin/rooms',
      method: 'GET',
      params: payload,
    });
  }

  async createRoom(payload: CreateRoomPayload) {
    return this.httpClient.call<Room, CreateRoomPayload>({
      path: '/admin/rooms',
      method: 'POST',
      data: payload,
    });
  }

  async updateRoom(id: string, payload: UpdateRoomPayload) {
    return this.httpClient.call<Room, UpdateRoomPayload>({
      path: `/admin/rooms/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async reactivateRoom(id: string) {
    return this.httpClient.call<Room>({
      path: `/admin/rooms/${id}/reactivate`,
      method: 'POST',
    });
  }

  async deleteRoom(id: string) {
    return this.httpClient.call({
      path: `/admin/rooms/${id}/deactivate`,
      method: 'POST',
    });
  }

  async getClasses(payload?: GetClassesParams) {
    return this.httpClient.call<Array<ClassDefinition>>({
      path: '/admin/class-catalog',
      method: 'GET',
      params: payload,
    });
  }

  async createClass(payload: CreateClassDefinitionPayload) {
    return this.httpClient.call<ClassDefinition, CreateClassDefinitionPayload>({
      path: '/admin/class-catalog',
      method: 'POST',
      data: payload,
    });
  }

  async updateClass(id: string, payload: UpdateClassDefinitionPayload) {
    return this.httpClient.call<ClassDefinition, UpdateClassDefinitionPayload>({
      path: `/admin/class-catalog/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async reactivateClass(id: string) {
    return this.httpClient.call<ClassDefinition>({
      path: `/admin/class-catalog/${id}/reactivate`,
      method: 'POST',
    });
  }

  async deleteClass(id: string) {
    return this.httpClient.call({
      path: `/admin/class-catalog/${id}/deactivate`,
      method: 'POST',
    });
  }
}
