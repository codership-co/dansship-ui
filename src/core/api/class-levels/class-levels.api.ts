import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { StudentClassLevelItem, StudentClassLevelsResponse, UpdateClassLevelPayload } from './class-levels.models';

export class ClassLevelsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listMine() {
    return this.httpClient.callNoError<StudentClassLevelsResponse>({
      path: '/class-levels/me',
      method: 'GET',
    });
  }

  async upsertMine(classDefinitionId: string, payload: UpdateClassLevelPayload) {
    return this.httpClient.callNoError<StudentClassLevelItem, UpdateClassLevelPayload>({
      path: `/class-levels/me/${classDefinitionId}`,
      method: 'PUT',
      data: payload,
    });
  }
}
