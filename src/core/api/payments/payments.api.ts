import { HttpClient } from 'polpo-http-client';

import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';

import { mapAppliedDiscounts, normalizeIntent, toNumber } from './payments.helpers';

import {
  DANSSHIP_ERROR_CATEGORY,
  DANSSHIP_ERROR_CODE,
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

const MISSING_INTENT_ID_MESSAGE = 'Payment intent id is required';

function missingPaymentIntentError(path: string) {
  return new DansshipAPIError(
    {
      category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR,
      error_code: DANSSHIP_ERROR_CODE.BAD_REQUEST,
      message: MISSING_INTENT_ID_MESSAGE,
      status: 0,
      timestamp: new Date(0).toISOString(),
      path,
      details: {
        next_action: '',
        resend_verification_endpoint: '',
      },
      request_id: null,
      trace_id: null,
    },
    0,
    MISSING_INTENT_ID_MESSAGE,
  );
}

function paymentIntentId(id: string): string {
  return id.trim();
}

function missingIntentResult(path: string) {
  return {
    ok: false as const,
    data: null,
    status: 0,
    error: missingPaymentIntentError(path),
  };
}

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

  async createBoldCheckoutForIntent(id: string) {
    const intentId = paymentIntentId(id);

    if (!intentId) {
      return missingIntentResult('/payments/intents/bold/checkout');
    }

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
        applied_discounts: mapAppliedDiscounts(data.applied_discounts),
        is_first_plan_purchase: data.is_first_plan_purchase ?? false,
        wallet_amount_applied: toNumber(data.wallet_amount_applied),
        amount_to_charge: toNumber(data.amount_to_charge, toNumber(data.final_price)),
        payment_option: data.payment_option === 'fifty_fifty' ? 'fifty_fifty' : 'full',
        installment_options: [],
        deposit_amount:
          data.deposit_amount !== null && data.deposit_amount !== undefined ? toNumber(data.deposit_amount) : null,
        balance_amount:
          data.balance_amount !== null && data.balance_amount !== undefined ? toNumber(data.balance_amount) : null,
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
    const intentId = paymentIntentId(id);

    if (!intentId) {
      return missingIntentResult('/payments/intents');
    }

    return this.httpClient.callNoError<PaymentIntentDetail>(
      {
        path: `/payments/intents/${intentId}`,
        method: 'GET',
      },
      intent => normalizeIntent(intent) as PaymentIntentDetail,
    );
  }

  async cancelIntent(id: string) {
    const intentId = paymentIntentId(id);

    if (!intentId) {
      return missingIntentResult('/payments/intents/cancel');
    }

    return this.httpClient.callNoError<PaymentIntent>(
      {
        path: `/payments/intents/${intentId}/cancel`,
        method: 'POST',
      },
      normalizeIntent,
    );
  }

  private async getProofUploadUrl(id: string, payload: PaymentProofUploadRequest) {
    const intentId = paymentIntentId(id);

    if (!intentId) {
      throw missingPaymentIntentError('/payments/intents/proof/upload-url');
    }

    return this.httpClient.call<PresignedUrlResponse, PaymentProofUploadRequest>({
      path: `/payments/intents/${intentId}/proof/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  private async confirmProofUpload(id: string, payload: ConfirmPaymentProofPayload) {
    const intentId = paymentIntentId(id);

    if (!intentId) {
      throw missingPaymentIntentError('/payments/intents/proof/confirm');
    }

    return this.httpClient.call<PaymentIntent, ConfirmPaymentProofPayload>(
      {
        path: `/payments/intents/${intentId}/proof/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeIntent,
    );
  }

  async uploadProof(id: string, file: File) {
    return uploadFileWithPresignedRetry(
      file,
      () =>
        this.getProofUploadUrl(id, {
          content_type: file.type as PaymentProofContentType,
        }),
      fileKey => this.confirmProofUpload(id, { file_key: fileKey }),
    );
  }

  async getProofViewUrl(id: string) {
    const intentId = paymentIntentId(id);

    if (!intentId) {
      return missingIntentResult('/payments/intents/proof/view-url');
    }

    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/payments/intents/${intentId}/proof/view-url`,
      method: 'GET',
    });
  }
}
