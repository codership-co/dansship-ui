import { HttpClient } from 'polpo-http-client';

import { downloadCsvFile } from '../common/download-csv';
import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';
import { toNumber } from '../payments/payments.helpers';

import { uploadAnswerFile } from './participation.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  AdminEnrollmentPayload,
  AdminEnrollmentQuote,
  AdminEnrollmentResult,
  AdminSignupDetail,
  AdminSignupUpdatePayload,
  AnswerFileDownloads,
  AnswerFileUpload,
  AnswerFileView,
  FileAnswer,
  ParticipantTermsVersion,
  ParticipantTypeAdmin,
  ParticipantTypePreset,
  ParticipantTypeUpsert,
  TicketLine,
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

  if (query.entered !== undefined && query.entered !== null) params.entered = String(query.entered);

  return params;
}

type RawEnrollmentQuote = Omit<AdminEnrollmentQuote, 'total' | 'discount_percent' | 'deposit' | 'balance' | 'lines'> & {
  total: string | number;
  discount_percent: string | number | null;
  deposit: string | number;
  balance: string | number;
  lines: Array<Omit<TicketLine, 'price'> & { price: string | number }>;
};

function toEnrollmentQuote(data: RawEnrollmentQuote): AdminEnrollmentQuote {
  return {
    charges_money: data.charges_money,
    total: toNumber(data.total),
    discount_percent: data.discount_percent === null ? null : toNumber(data.discount_percent),
    deposit: toNumber(data.deposit),
    balance: toNumber(data.balance),
    lines: data.lines.map(line => ({ ...line, price: toNumber(line.price) })),
  };
}

/** Admin side of participant types (ADR-064, events redesign). manage:event, except enrollment (enroll:event). */
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

  async updateType(eventId: string, typeId: string, payload: ParticipantTypeUpsert) {
    return this.httpClient.callNoError<ParticipantTypeAdmin, ParticipantTypeUpsert>({
      path: `/admin/events/${eventId}/participant-types/${typeId}`,
      method: 'PUT',
      data: payload,
    });
  }

  /** Only while the event is a draft and nobody signed up under the type (`EVENT_PARTICIPANT_TYPE_NOT_DELETABLE`). */
  async deleteType(eventId: string, typeId: string) {
    return this.httpClient.callNoError<void>({
      path: `/admin/events/${eventId}/participant-types/${typeId}`,
      method: 'DELETE',
    });
  }

  /** Terms of the event (one PDF for every type), newest version first. */
  async listEventTerms(eventId: string) {
    return this.httpClient.callNoError<Array<ParticipantTermsVersion>>({
      path: `/admin/events/${eventId}/terms`,
      method: 'GET',
    });
  }

  async getEventTermsUploadUrl(eventId: string, contentType: string) {
    return this.httpClient.callNoError<PresignedUrlResponse, { content_type: string }>({
      path: `/admin/events/${eventId}/terms/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  /** Uploads the terms PDF straight to the bucket and resolves with its file key. */
  async uploadEventTermsPdf(eventId: string, file: File) {
    return uploadFileWithPresignedRetry(
      file,
      async () => {
        const { ok, data } = await this.getEventTermsUploadUrl(eventId, file.type);

        return ok ? data : null;
      },
      async fileKey => fileKey,
    );
  }

  /** Every save with a different file or title is a new version; `file_key: null` = no terms from now on. */
  async saveEventTerms(eventId: string, payload: { title: string; file_key: string | null }) {
    return this.httpClient.callNoError<ParticipantTermsVersion, { title: string; file_key: string | null }>({
      path: `/admin/events/${eventId}/terms`,
      method: 'PUT',
      data: payload,
    });
  }

  /** "+ Inscribir persona": total, discount, deposit and balance (enroll:event). */
  async quoteEnrollment(eventId: string, payload: AdminEnrollmentPayload) {
    return this.httpClient.callNoError<RawEnrollmentQuote, AdminEnrollmentPayload, AdminEnrollmentQuote>(
      { path: `/admin/events/${eventId}/enrollments/quote`, method: 'POST', data: payload },
      toEnrollmentQuote,
    );
  }

  /** Enroll one person: paid (proof), pay later, or a free type (enroll:event). */
  async enroll(eventId: string, payload: AdminEnrollmentPayload) {
    return this.httpClient.callNoError<AdminEnrollmentResult, AdminEnrollmentPayload>({
      path: `/admin/events/${eventId}/enrollments`,
      method: 'POST',
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

  /** A short-lived link to a person's uploaded file (listen or download). */
  /** `download`: the link saves the file with its original name instead of opening it. */
  async getAnswerFile(signupId: string, fieldKey: string, download = false) {
    return this.httpClient.callNoError<AnswerFileView>({
      path: `/admin/events/signups/${signupId}/answers/${fieldKey}/file`,
      method: 'GET',
      params: download ? { download: 'true' } : undefined,
    });
  }

  /** «Descargar todos»: short-lived links to every file of one field, with names for the zip. */
  async listAnswerFiles(eventId: string, fieldKey: string, nameFieldKey?: string | null) {
    const params: Record<string, string> = { field_key: fieldKey };

    if (nameFieldKey) params.name_field_key = nameFieldKey;

    return this.httpClient.callNoError<AnswerFileDownloads>({
      path: `/admin/events/${eventId}/participation/files`,
      method: 'GET',
      params,
    });
  }

  /** "+ Inscribir persona": the admin uploads the file on the person's behalf (enroll:event). */
  async uploadAnswerFile(typeId: string, fieldKey: string, file: File): Promise<FileAnswer> {
    return uploadAnswerFile(file, async () => {
      const { ok, data, error } = await this.httpClient.callNoError<AnswerFileUpload, { content_type: string }>({
        path: `/admin/events/participant-types/${typeId}/fields/${fieldKey}/upload-url`,
        method: 'POST',
        data: { content_type: file.type },
      });

      if (!ok) throw error;

      return data;
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

  /** "Devuelto por fuera de la plataforma" (and undo with `false`). */
  async setRefundedOutside(signupId: string, refunded: boolean) {
    return this.httpClient.callNoError<AdminSignupDetail, { refunded: boolean }>({
      path: `/admin/events/signups/${signupId}/refunded-outside`,
      method: 'PUT',
      data: { refunded },
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
