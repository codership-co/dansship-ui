import { HttpClient } from 'polpo-http-client';

import {
  normalizeDoorCodeCurrent,
  normalizeDoorCodeRotateResponse,
  type DoorCodeCurrent,
  type DoorCodeRotatePayload,
  type DoorCodeRotateResponse,
} from './door-code.models';

import { DansshipAPIError } from '@core/api';

export class DoorCodeAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getCurrent() {
    return this.httpClient.callNoError<DoorCodeCurrent | null>(
      {
        path: '/admin/door-code',
        method: 'GET',
      },
      data => (data ? normalizeDoorCodeCurrent(data) : null),
    );
  }

  async rotate(payload: DoorCodeRotatePayload) {
    return this.httpClient.callNoError<DoorCodeRotateResponse, DoorCodeRotatePayload>(
      {
        path: '/admin/door-code',
        method: 'POST',
        data: payload,
      },
      normalizeDoorCodeRotateResponse,
    );
  }
}
