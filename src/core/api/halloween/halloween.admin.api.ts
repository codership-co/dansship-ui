import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { HalloweenSpinResult, HalloweenSpinStatus, HalloweenWheelConfig } from './halloween.models';

export class HalloweenAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async config() {
    return this.httpClient.callNoError<HalloweenWheelConfig>({
      path: '/admin/halloween/config',
      method: 'GET',
    });
  }

  async status(userId: string) {
    return this.httpClient.callNoError<HalloweenSpinStatus>({
      path: '/admin/halloween/spins/status',
      method: 'GET',
      params: { user_id: userId },
    });
  }

  async spin(userId: string) {
    return this.httpClient.callNoError<HalloweenSpinResult, { user_id: string }>({
      path: '/admin/halloween/spins',
      method: 'POST',
      data: { user_id: userId },
    });
  }
}
