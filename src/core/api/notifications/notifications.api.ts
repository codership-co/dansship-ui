import { HttpClient } from '@core/http-client';

import type { NotificationConfig, UpdateNotificationConfigPayload } from './notifications.models';

export class NotificationsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getConfigs() {
    return this.httpClient.call<Array<NotificationConfig>>({
      path: '/admin/notifications/config',
      method: 'GET',
    });
  }

  async updateConfig(type: string, payload: UpdateNotificationConfigPayload) {
    return this.httpClient.call<NotificationConfig>({
      path: `/admin/notifications/config/${type}`,
      method: 'PUT',
      data: payload,
    });
  }
}
