import { HttpClient } from 'polpo-http-client';

import { normalizeAdminList, normalizeIntent } from './payments.helpers';

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
  constructor(private readonly httpClient: HttpClient) {}

  async getAdminPayments(payload?: GetAdminPaymentsParams) {
    return this.httpClient.call<AdminPaymentListResponse>(
      {
        path: '/admin/payments',
        method: 'GET',
        params: payload,
      },
      normalizeAdminList,
    );
  }

  async getAdminPaymentDetail(id: string) {
    return this.httpClient.call<PaymentIntentDetail>(
      {
        path: `/admin/payments/${id}`,
        method: 'GET',
      },
      intent => normalizeIntent(intent) as PaymentIntentDetail,
    );
  }

  async getAdminPaymentProofViewUrl(id: string) {
    return this.httpClient.call<ProofViewUrlResponse>({
      path: `/admin/payments/${id}/proof/view-url`,
      method: 'GET',
    });
  }

  async getAdminProofUploadUrl(id: string, payload: PaymentProofUploadRequest) {
    return this.httpClient.call<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/admin/payments/${id}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmAdminProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    return this.httpClient.call<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/admin/payments/${id}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async reviewPayment(id: string, payload: AdminPaymentReviewPayload) {
    return this.httpClient.call<PaymentIntent, AdminPaymentReviewPayload>(
      {
        path: `/admin/payments/${id}/review`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }
}
