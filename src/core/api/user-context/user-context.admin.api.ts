import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  CreateUserChannelPayload,
  CreateUserNotePayload,
  UserChannelsResponse,
  UserNotesResponse,
} from './user-context.models';

export class UserContextAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getNotes(userId: string) {
    return this.httpClient.callNoError<UserNotesResponse>({
      path: `/admin/users/${userId}/notes`,
      method: 'GET',
    });
  }

  async createNote(userId: string, payload: CreateUserNotePayload) {
    return this.httpClient.callNoError<UserNotesResponse, CreateUserNotePayload>({
      path: `/admin/users/${userId}/notes`,
      method: 'POST',
      data: payload,
    });
  }

  async getChannels(userId: string) {
    return this.httpClient.callNoError<UserChannelsResponse>({
      path: `/admin/users/${userId}/channels`,
      method: 'GET',
    });
  }

  async createChannel(userId: string, payload: CreateUserChannelPayload) {
    return this.httpClient.callNoError<UserChannelsResponse, CreateUserChannelPayload>({
      path: `/admin/users/${userId}/channels`,
      method: 'POST',
      data: payload,
    });
  }

  async markChannelFavorite(userId: string, channelId: string) {
    return this.httpClient.callNoError<UserChannelsResponse>({
      path: `/admin/users/${userId}/channels/${channelId}/favorite`,
      method: 'POST',
    });
  }
}
