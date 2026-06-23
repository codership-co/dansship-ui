import { HttpClient } from 'polpo-http-client';

import type { NotificationConfig, UpdateNotificationConfigPayload } from './notifications.models';

export class NotificationsAdminApi {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

  async getConfigs() {
    return this.httpClient.callNoError<Array<NotificationConfig>>({
      path: '/admin/notifications/config',
      method: 'GET',
    });
  }

  async updateConfig(type: string, payload: UpdateNotificationConfigPayload) {
    return this.httpClient.callNoError<NotificationConfig>({
      path: `/admin/notifications/config/${type}`,
      method: 'PUT',
      data: payload,
    });
  }
}
