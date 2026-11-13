import { HttpClient } from 'polpo-http-client';

import { normalizeClassRecoveryReview, normalizeUserClassRecoveries } from './class-recovery.helpers';

import type {
  ClassRecoveryReview,
  ClassRecoverySettings,
  UpdateClassRecoverySettingsPayload,
  UserClassRecoveries,
} from './class-recovery.models';
import type { DansshipAPIError } from '@core/api';

export class ClassRecoveryAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getSettings() {
    return this.httpClient.callNoError<ClassRecoverySettings>({
      path: '/admin/class-recoveries/settings',
      method: 'GET',
    });
  }

  async updateSettings(payload: UpdateClassRecoverySettingsPayload) {
    return this.httpClient.callNoError<ClassRecoverySettings, UpdateClassRecoverySettingsPayload>({
      path: '/admin/class-recoveries/settings',
      method: 'PUT',
      data: payload,
    });
  }

  async getPaymentReview(paymentIntentId: string) {
    return this.httpClient.callNoError<ClassRecoveryReview>(
      { path: `/admin/class-recoveries/payments/${paymentIntentId}`, method: 'GET' },
      normalizeClassRecoveryReview,
    );
  }

  async getUserRecoveries(userId: string) {
    return this.httpClient.callNoError<UserClassRecoveries>(
      { path: `/admin/class-recoveries/users/${userId}`, method: 'GET' },
      normalizeUserClassRecoveries,
    );
  }
}
