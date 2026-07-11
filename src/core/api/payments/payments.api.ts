import { HttpClient } from 'polpo-http-client';

import { normalizeIntent } from './payments.helpers';

import { DansshipAPIError, PaymentProofContentType } from '@core/api';

import type {
  BoldCheckoutBootstrapResponse,
  ConfirmPaymentProofPayload,
  CreatePaymentIntentPayload,
  PaymentIntent,
  PaymentIntentDetail,
  PaymentProofUploadRequest,
  PresignedUrlResponse,
  ProofViewUrlResponse,
} from './payments.models';

export class PaymentsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async createIntent(payload: CreatePaymentIntentPayload) {
    return this.httpClient.callNoError<PaymentIntent, CreatePaymentIntentPayload>(
      {
        path: '/payments/intents',
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async createBoldCheckout(payload: CreatePaymentIntentPayload) {
    return this.httpClient.callNoError<BoldCheckoutBootstrapResponse, CreatePaymentIntentPayload>(
      {
        path: '/payments/intents/bold/checkout',
        method: 'POST',
        data: payload,
      },
      data => ({
        ...data,
        intent: normalizeIntent(data.intent),
      }),
    );
  }

  async getMyIntents() {
    return this.httpClient.callNoError<Array<PaymentIntent>>(
      {
        path: '/payments/intents/me',
        method: 'GET',
      },
      items => items.map(normalizeIntent),
    );
  }

  async getIntent(id: string) {
    return this.httpClient.callNoError<PaymentIntentDetail>(
      {
        path: `/payments/intents/${id}`,
        method: 'GET',
      },
      intent => normalizeIntent(intent) as PaymentIntentDetail,
    );
  }

  async cancelIntent(id: string) {
    return this.httpClient.callNoError<PaymentIntent>(
      {
        path: `/payments/intents/${id}/cancel`,
        method: 'POST',
      },
      normalizeIntent,
    );
  }

  private async getProofUploadUrl(id: string, payload: PaymentProofUploadRequest) {
    return this.httpClient.callNoError<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/payments/intents/${id}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  private async confirmProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    return this.httpClient.callNoError<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/payments/intents/${id}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async uploadProof(id: string, file: File) {
    const { data, ok } = await this.getProofUploadUrl(id, {
      content_type: file.type as PaymentProofContentType,
    });

    if (ok) {
      const uploadResponse = await fetch(data.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (uploadResponse.ok) {
        await this.confirmProofUpload(id, { file_key: data.file_key });
      }
    }
  }

  async getProofViewUrl(id: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/payments/intents/${id}/proof/view-url`,
      method: 'GET',
    });
  }
}
