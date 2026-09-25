import { HttpClient } from 'polpo-http-client';

import { mapAppliedDiscounts, toNumber } from '../payments/payments.helpers';

import { DansshipAPIError, type PaymentPreviewMappedResponse, type PaymentPreviewResponse } from '@core/api';

import type {
  CollaboratorPaymentItem,
  CollaboratorWorkshopSummary,
  DirectRegistrationPayload,
  PartnerLookupResponse,
  WorkshopCatalogCard,
  WorkshopImageConfirmRequest,
  WorkshopImageUploadRequest,
  WorkshopImageUploadResponse,
  WorkshopLanding,
  WorkshopPurchaseCreatePayload,
  WorkshopPurchaseResponse,
  WorkshopRosterEntry,
  MyWorkshopRegistration,
  MyWorkshopRegistrationScope,
  WorkshopAdmin,
} from './talleres.models';

export class TalleresAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listCatalog() {
    return this.httpClient.callNoError<Array<WorkshopCatalogCard>>({
      path: '/workshops/catalog',
      method: 'GET',
    });
  }

  async getBySlug(slug: string) {
    return this.httpClient.callNoError<WorkshopLanding>({
      path: `/workshops/by-slug/${slug}`,
      method: 'GET',
    });
  }

  async previewPricing(slug: string) {
    return this.httpClient.callNoError<PaymentPreviewResponse, object, PaymentPreviewMappedResponse>(
      {
        path: `/workshops/by-slug/${slug}/pricing`,
        method: 'GET',
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
        deposit_amount:
          data.deposit_amount !== null && data.deposit_amount !== undefined ? toNumber(data.deposit_amount) : null,
        balance_amount:
          data.balance_amount !== null && data.balance_amount !== undefined ? toNumber(data.balance_amount) : null,
      }),
    );
  }

  async lookupPartner(email: string) {
    return this.httpClient.callNoError<PartnerLookupResponse>({
      path: '/workshops/partner',
      method: 'GET',
      params: { email },
    });
  }

  async createPurchase(payload: WorkshopPurchaseCreatePayload) {
    return this.httpClient.callNoError<WorkshopPurchaseResponse, WorkshopPurchaseCreatePayload>({
      path: '/workshops/purchases',
      method: 'POST',
      data: payload,
    });
  }

  async listMyRegistrations({ scope }: { scope: MyWorkshopRegistrationScope }) {
    return this.httpClient.callNoError<Array<MyWorkshopRegistration>>({
      path: '/workshops/registrations/me',
      method: 'GET',
      params: { scope },
    });
  }

  async listCollaborations() {
    return this.httpClient.callNoError<Array<CollaboratorWorkshopSummary>>({
      path: '/workshops/collaborations',
      method: 'GET',
    });
  }

  async collaboratorRoster(workshopId: string) {
    return this.httpClient.callNoError<Array<WorkshopRosterEntry>>({
      path: `/workshops/collaborations/${workshopId}/roster`,
      method: 'GET',
    });
  }

  async collaboratorPayments(workshopId: string) {
    return this.httpClient.callNoError<Array<CollaboratorPaymentItem>>({
      path: `/workshops/collaborations/${workshopId}/payments`,
      method: 'GET',
    });
  }

  async reviewCollaboratorPayment(
    workshopId: string,
    paymentIntentId: string,
    payload: { action: 'approve' | 'reject'; admin_notes?: string | null },
  ) {
    return this.httpClient.callNoError<CollaboratorPaymentItem>({
      path: `/workshops/collaborations/${workshopId}/payments/${paymentIntentId}/review`,
      method: 'POST',
      data: payload,
    });
  }

  async collaboratorRegister(workshopId: string, payload: DirectRegistrationPayload) {
    return this.httpClient.callNoError<WorkshopRosterEntry, DirectRegistrationPayload>({
      path: `/workshops/collaborations/${workshopId}/registrations`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadCollaboratorPaymentQr(workshopId: string, file: File) {
    const response = await this.httpClient.callNoError<WorkshopImageUploadResponse, WorkshopImageUploadRequest>({
      path: `/workshops/collaborations/${workshopId}/payment-qr/upload-url`,
      method: 'POST',
      data: { content_type: file.type as WorkshopImageUploadRequest['content_type'] },
    });

    if (!response.data) {
      return response;
    }

    const uploadResponse = await fetch(response.data.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('WORKSHOP_IMAGE_UPLOAD_FAILED');
    }

    return this.httpClient.callNoError<WorkshopAdmin, WorkshopImageConfirmRequest>({
      path: `/workshops/collaborations/${workshopId}/payment-qr/confirm`,
      method: 'POST',
      data: { file_key: response.data.file_key },
    });
  }
}
