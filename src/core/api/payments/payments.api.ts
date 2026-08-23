import { HttpClient } from 'polpo-http-client';

import { normalizeIntent, toNumber } from './payments.helpers';

import {
  DansshipAPIError,
  PaymentPreviewMappedResponse,
  PaymentPreviewRequest,
  PaymentPreviewResponse,
  PaymentProofContentType,
} from '@core/api';

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

  async createBoldCheckoutForIntent(intentId: string) {
    return this.httpClient.callNoError<BoldCheckoutBootstrapResponse>(
      {
        path: `/payments/intents/${intentId}/bold/checkout`,
        method: 'POST',
      },
      data => ({
        ...data,
        intent: normalizeIntent(data.intent),
      }),
    );
  }

  async previewPayment(payload: PaymentPreviewRequest) {
    return this.httpClient.callNoError<PaymentPreviewResponse, PaymentPreviewRequest, PaymentPreviewMappedResponse>(
      {
        path: '/payments/preview',
        method: 'POST',
        data: payload,
      },
      data => ({
        ...data,
        base_amount: toNumber(data.base_amount),
        discount_value: toNumber(data.discount_value) || 0,
        final_price: toNumber(data.final_price),
        original_price: toNumber(data.original_price),
        tax_amount: toNumber(data.tax_amount),
        tax_rate_percentage: toNumber(data.tax_rate_percentage),
        bonus_classes_granted: data.bonus_classes_granted ?? null,
        bonus_expires_days: data.bonus_expires_days ?? null,
        bonus_benefit_name: data.bonus_benefit_name ?? null,
        discount_benefit_code: data.discount_benefit_code ?? null,
        wallet_amount_applied: toNumber(data.wallet_amount_applied),
        amount_to_charge: toNumber(data.amount_to_charge, toNumber(data.final_price)),
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
    return this.httpClient.call<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/payments/intents/${id}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  private async confirmProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    return this.httpClient.call<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/payments/intents/${id}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async uploadProof(id: string, file: File) {
    const data = await this.getProofUploadUrl(id, {
      content_type: file.type as PaymentProofContentType,
    });
    const uploadResponse = await fetch(data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (uploadResponse.ok) {
      return this.confirmProofUpload(id, { file_key: data.file_key });
    }
  }

  async getProofViewUrl(id: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/payments/intents/${id}/proof/view-url`,
      method: 'GET',
    });
  }
}
