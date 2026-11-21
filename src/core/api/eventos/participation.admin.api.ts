import { HttpClient } from 'polpo-http-client';

import { downloadCsvFile } from '../common/download-csv';
import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';

import { DansshipAPIError } from '@core/api';

import type {
  AdminSignupDetail,
  AdminSignupUpdatePayload,
  ParticipantTermsVersion,
  ParticipantTypeAdmin,
  ParticipantTypeConfig,
  ParticipantTypePreset,
  ParticipationPeople,
  ParticipationPeopleQuery,
  ParticipationSummary,
} from './participation.models';
import type { PresignedUrlResponse } from '../payments/payments.models';

function peopleParams(query: ParticipationPeopleQuery): Record<string, string> {
  const params: Record<string, string> = {};

  if (query.kind) params.kind = query.kind;

  if (query.participant_type_id) params.participant_type_id = query.participant_type_id;

  if (query.status) params.status = query.status;

  if (query.q?.trim()) params.q = query.q.trim();

  return params;
}

/** Admin side of participant types (ADR-064). Every endpoint needs manage:event. */
export class ParticipationAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listTypes(eventId: string) {
    return this.httpClient.callNoError<Array<ParticipantTypeAdmin>>({
      path: `/admin/events/${eventId}/participant-types`,
      method: 'GET',
    });
  }

  async createType(eventId: string, preset: ParticipantTypePreset | null) {
    return this.httpClient.callNoError<ParticipantTypeAdmin, { preset: ParticipantTypePreset | null }>({
      path: `/admin/events/${eventId}/participant-types`,
      method: 'POST',
      data: { preset },
    });
  }

  async updateType(eventId: string, typeId: string, payload: ParticipantTypeConfig) {
    return this.httpClient.callNoError<ParticipantTypeAdmin, ParticipantTypeConfig>({
      path: `/admin/events/${eventId}/participant-types/${typeId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async rotateToken(eventId: string, typeId: string) {
    return this.httpClient.callNoError<ParticipantTypeAdmin>({
      path: `/admin/events/${eventId}/participant-types/${typeId}/access-token/rotate`,
      method: 'POST',
    });
  }

  async listTerms(eventId: string, typeId: string) {
    return this.httpClient.callNoError<Array<ParticipantTermsVersion>>({
      path: `/admin/events/${eventId}/participant-types/${typeId}/terms`,
      method: 'GET',
    });
  }

  async getTermsUploadUrl(eventId: string, typeId: string, contentType: string) {
    return this.httpClient.callNoError<PresignedUrlResponse, { content_type: string }>({
      path: `/admin/events/${eventId}/participant-types/${typeId}/terms/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  /** Uploads the terms PDF straight to the bucket and resolves with its file key. */
  async uploadTermsPdf(eventId: string, typeId: string, file: File) {
    return uploadFileWithPresignedRetry(
      file,
      async () => {
        const { ok, data } = await this.getTermsUploadUrl(eventId, typeId, file.type);

        return ok ? data : null;
      },
      async fileKey => fileKey,
    );
  }

  async saveTerms(eventId: string, typeId: string, payload: { title: string; file_key: string | null }) {
    return this.httpClient.callNoError<ParticipantTermsVersion, { title: string; file_key: string | null }>({
      path: `/admin/events/${eventId}/participant-types/${typeId}/terms`,
      method: 'PUT',
      data: payload,
    });
  }

  async getSummary(eventId: string) {
    return this.httpClient.callNoError<ParticipationSummary>({
      path: `/admin/events/${eventId}/participation/summary`,
      method: 'GET',
    });
  }

  async listPeople(eventId: string, query: ParticipationPeopleQuery) {
    return this.httpClient.callNoError<ParticipationPeople>({
      path: `/admin/events/${eventId}/participation/people`,
      method: 'GET',
      params: peopleParams(query),
    });
  }

  async downloadPeopleCsv(eventId: string, query: ParticipationPeopleQuery, filename: string) {
    await downloadCsvFile(`/admin/events/${eventId}/participation/people.csv`, filename, peopleParams(query));
  }

  async getSignup(signupId: string) {
    return this.httpClient.callNoError<AdminSignupDetail>({
      path: `/admin/events/signups/${signupId}`,
      method: 'GET',
    });
  }

  async approve(signupId: string) {
    return this.httpClient.callNoError<AdminSignupDetail>({
      path: `/admin/events/signups/${signupId}/approve`,
      method: 'POST',
    });
  }

  async reject(signupId: string) {
    return this.httpClient.callNoError<AdminSignupDetail>({
      path: `/admin/events/signups/${signupId}/reject`,
      method: 'POST',
    });
  }

  async updateAdminFields(signupId: string, payload: AdminSignupUpdatePayload) {
    return this.httpClient.callNoError<AdminSignupDetail, AdminSignupUpdatePayload>({
      path: `/admin/events/signups/${signupId}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async setDonationReceived(signupId: string, received: boolean) {
    return this.httpClient.callNoError<AdminSignupDetail, { received: boolean }>({
      path: `/admin/events/signups/${signupId}/donation-received`,
      method: 'PUT',
      data: { received },
    });
  }
}
