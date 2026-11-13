import { HttpClient } from 'polpo-http-client';

import {
  normalizeClassRecoveries,
  normalizeClassRecovery,
  normalizeClassRecoveryPreview,
  normalizeRecoverableList,
} from './class-recovery.helpers';

import type {
  ClassRecovery,
  ClassRecoveryPreview,
  CreateClassRecoveryPayload,
  RecoverableList,
  RecoverySelection,
} from './class-recovery.models';
import type { DansshipAPIError } from '@core/api';

export class ClassRecoveryAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getRecoverable() {
    return this.httpClient.callNoError<RecoverableList>(
      { path: '/class-recoveries/recoverable', method: 'GET' },
      normalizeRecoverableList,
    );
  }

  async preview(payload: RecoverySelection) {
    return this.httpClient.callNoError<ClassRecoveryPreview, RecoverySelection>(
      { path: '/class-recoveries/preview', method: 'POST', data: payload },
      normalizeClassRecoveryPreview,
    );
  }

  async create(payload: CreateClassRecoveryPayload) {
    return this.httpClient.callNoError<ClassRecovery, CreateClassRecoveryPayload>(
      { path: '/class-recoveries', method: 'POST', data: payload },
      normalizeClassRecovery,
    );
  }

  async getMine() {
    return this.httpClient.callNoError<Array<ClassRecovery>>(
      { path: '/class-recoveries', method: 'GET' },
      normalizeClassRecoveries,
    );
  }

  async get(recoveryId: string) {
    return this.httpClient.callNoError<ClassRecovery>(
      { path: `/class-recoveries/${recoveryId}`, method: 'GET' },
      normalizeClassRecovery,
    );
  }
}
