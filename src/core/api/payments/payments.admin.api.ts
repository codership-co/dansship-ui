import { HttpClient } from 'polpo-http-client';

import { normalizeAdminList, normalizeIntent } from './payments.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  AdminPaymentListResponse,
  AdminPaymentReviewPayload,
  ConfirmPaymentProofPayload,
  GetAdminPaymentsParams,
  PaymentIntent,
  PaymentIntentDetail,
  PaymentProofUploadRequest,
  PresignedUrlResponse,
  ProofViewUrlResponse,
} from './payments.models';

export class PaymentsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getAdminPayments(payload?: GetAdminPaymentsParams) {
    return this.httpClient.callNoError<AdminPaymentListResponse>(
      {
        path: '/admin/payments',
        method: 'GET',
        params: payload,
      },
      normalizeAdminList,
    );
  }

  async getAdminPaymentDetail(id: string) {
    return this.httpClient.callNoError<PaymentIntentDetail>(
      {
        path: `/admin/payments/${id}`,
        method: 'GET',
      },
      intent => normalizeIntent(intent) as PaymentIntentDetail,
    );
  }

  async getAdminPaymentProofViewUrl(id: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/payments/${id}/proof/view-url`,
      method: 'GET',
    });
  }

  async getAdminProofUploadUrl(id: string, payload: PaymentProofUploadRequest) {
    return this.httpClient.callNoError<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/admin/payments/${id}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmAdminProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    return this.httpClient.callNoError<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/admin/payments/${id}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async reviewPayment(id: string, payload: AdminPaymentReviewPayload) {
    return this.httpClient.callNoError<PaymentIntent, AdminPaymentReviewPayload>(
      {
        path: `/admin/payments/${id}/review`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }
}
