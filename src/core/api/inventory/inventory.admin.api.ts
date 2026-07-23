import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  ClassDefinition,
  ClassGroup,
  CreateClassDefinitionPayload,
  CreateRoomPayload,
  GetClassesParams,
  GetRoomsParams,
  Room,
  RoomImageConfirmRequest,
  RoomImageUploadRequest,
  RoomImageUploadResponse,
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

  async getRoomImageUploadUrl(id: string, payload: RoomImageUploadRequest) {
    return this.httpClient.callNoError<RoomImageUploadResponse, RoomImageUploadRequest>({
      path: `/admin/rooms/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmRoomImageUpload(id: string, payload: RoomImageConfirmRequest) {
    return this.httpClient.callNoError<Room, RoomImageConfirmRequest>({
      path: `/admin/rooms/${id}/image/confirm`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadRoomImage(id: string, file: File) {
    const response = await this.getRoomImageUploadUrl(id, {
      content_type: file.type as RoomImageUploadRequest['content_type'],
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
      throw new Error('ROOM_IMAGE_UPLOAD_FAILED');
    }

    return this.confirmRoomImageUpload(id, { file_key });
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

  async getClassGroups() {
    return this.httpClient.callNoError<Array<ClassGroup>>({
      path: '/admin/class-groups',
      method: 'GET',
    });
  }
}
