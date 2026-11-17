import { HttpClient } from 'polpo-http-client';

import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';

import { DansshipAPIError } from '@core/api';

import type {
  BenefitGrant,
  BenefitWindow,
  ListBenefitGrantsParams,
  PromotionWindowTerms,
  SaveWindowTermsPayload,
  SetTwoForOneWeekPayload,
  TwoForOneWeek,
  UpdateBenefitWindowPayload,
  WindowTermsVersion,
} from './benefits.models';
import type { PresignedUrlResponse } from '../payments/payments.models';

export class BenefitsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listGrants(params: ListBenefitGrantsParams) {
    return this.httpClient.callNoError<Array<BenefitGrant>>({
      path: '/admin/benefits/grants',
      method: 'GET',
      params,
    });
  }

  async listWindows() {
    return this.httpClient.callNoError<Array<BenefitWindow>>({
      path: '/admin/benefits/windows',
      method: 'GET',
    });
  }

  async updateWindow(id: string, payload: UpdateBenefitWindowPayload) {
    return this.httpClient.callNoError<BenefitWindow, UpdateBenefitWindowPayload>({
      path: `/admin/benefits/windows/${id}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async listPromotionWindowTerms() {
    return this.httpClient.callNoError<Array<PromotionWindowTerms>>({
      path: '/admin/benefits/window-terms',
      method: 'GET',
    });
  }

  async listWindowTermsVersions(definitionId: string) {
    return this.httpClient.callNoError<Array<WindowTermsVersion>>({
      path: `/admin/benefits/windows/${definitionId}/terms/versions`,
      method: 'GET',
    });
  }

  async getWindowTermsUploadUrl(definitionId: string, contentType: string) {
    return this.httpClient.callNoError<PresignedUrlResponse, { content_type: string }>({
      path: `/admin/benefits/windows/${definitionId}/terms/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  /** Uploads the terms PDF straight to the bucket and resolves with its file key. */
  async uploadWindowTermsPdf(definitionId: string, file: File) {
    return uploadFileWithPresignedRetry(
      file,
      async () => {
        const { ok, data } = await this.getWindowTermsUploadUrl(definitionId, file.type);

        return ok ? data : null;
      },
      async fileKey => fileKey,
    );
  }

  async saveWindowTerms(definitionId: string, payload: SaveWindowTermsPayload) {
    return this.httpClient.callNoError<WindowTermsVersion, SaveWindowTermsPayload>({
      path: `/admin/benefits/windows/${definitionId}/terms`,
      method: 'PUT',
      data: payload,
    });
  }

  async listTwoForOneWeeks() {
    return this.httpClient.callNoError<Array<TwoForOneWeek>>({
      path: '/admin/benefits/two-for-one-weeks',
      method: 'GET',
    });
  }

  async setTwoForOneWeek(weekId: string, payload: SetTwoForOneWeekPayload) {
    return this.httpClient.callNoError<TwoForOneWeek, SetTwoForOneWeekPayload>({
      path: `/admin/benefits/two-for-one-weeks/${weekId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async clearTwoForOneWeek(weekId: string) {
    return this.httpClient.callNoError<TwoForOneWeek>({
      path: `/admin/benefits/two-for-one-weeks/${weekId}`,
      method: 'DELETE',
    });
  }
}
