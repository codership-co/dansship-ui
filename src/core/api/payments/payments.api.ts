import { HttpClient } from 'polpo-http-client';

import { normalizeIntent } from './payments.helpers';

import type {
  ConfirmPaymentProofPayload,
  CreatePaymentIntentPayload,
  PaymentIntent,
  PaymentIntentDetail,
  PaymentProofUploadRequest,
  PresignedUrlResponse,
  ProofViewUrlResponse,
} from './payments.models';

export class PaymentsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async createIntent(payload: CreatePaymentIntentPayload) {
    return this.httpClient.call<PaymentIntent, CreatePaymentIntentPayload>(
      {
        path: '/payments/intents',
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async getMyIntents() {
    return this.httpClient.call<Array<PaymentIntent>>(
      {
        path: '/payments/intents/me',
        method: 'GET',
      },
      items => items.map(normalizeIntent),
    );
  }

  async getIntent(id: string) {
    return this.httpClient.call<PaymentIntentDetail>(
      {
        path: `/payments/intents/${id}`,
        method: 'GET',
      },
      intent => normalizeIntent(intent) as PaymentIntentDetail,
    );
  }

  async cancelIntent(id: string) {
    return this.httpClient.call<PaymentIntent>(
      {
        path: `/payments/intents/${id}/cancel`,
        method: 'POST',
      },
      normalizeIntent,
    );
  }

  async getProofUploadUrl(id: string, payload: PaymentProofUploadRequest) {
    return this.httpClient.call<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/payments/intents/${id}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    return this.httpClient.call<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/payments/intents/${id}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async getProofViewUrl(id: string) {
    return this.httpClient.call<ProofViewUrlResponse>({
      path: `/payments/intents/${id}/proof/view-url`,
      method: 'GET',
    });
  }
}
