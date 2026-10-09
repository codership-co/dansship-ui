import { HttpClient } from 'polpo-http-client';

import { mapAppliedDiscounts, toNumber } from '../payments/payments.helpers';

import { DansshipAPIError, type PaymentPreviewMappedResponse, type PaymentPreviewResponse } from '@core/api';

import type {
  CollaboratorPaymentItem,
  CollaboratorEventSummary,
  DirectRegistrationPayload,
  PartnerLookupResponse,
  EventCatalogCard,
  EventImageConfirmRequest,
  EventImageUploadRequest,
  EventImageUploadResponse,
  EventLanding,
  EventPurchaseCreatePayload,
  EventPurchaseResponse,
  InstructorTeachingRosterEntry,
  InstructorTeachingUpcomingWeek,
  InstructorTeachingEvent,
  EventRosterEntry,
  MyEventRegistration,
  MyEventRegistrationScope,
  EventAdmin,
} from './eventos.models';

export class EventosAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async listCatalog() {
    return this.httpClient.callNoError<Array<EventCatalogCard>>({
      path: '/events/catalog',
      method: 'GET',
    });
  }

  async getBySlug(slug: string) {
    return this.httpClient.callNoError<EventLanding>({
      path: `/events/by-slug/${slug}`,
      method: 'GET',
    });
  }

  async previewPricing(slug: string) {
    return this.httpClient.callNoError<PaymentPreviewResponse, object, PaymentPreviewMappedResponse>(
      {
        path: `/events/by-slug/${slug}/pricing`,
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
      path: '/events/partner',
      method: 'GET',
      params: { email },
    });
  }

  async createPurchase(payload: EventPurchaseCreatePayload) {
    return this.httpClient.callNoError<EventPurchaseResponse, EventPurchaseCreatePayload>({
      path: '/events/purchases',
      method: 'POST',
      data: payload,
    });
  }

  async listMyRegistrations({ scope }: { scope: MyEventRegistrationScope }) {
    return this.httpClient.callNoError<Array<MyEventRegistration>>({
      path: '/events/registrations/me',
      method: 'GET',
      params: { scope },
    });
  }

  async listTeachingWeek(weekStartDate: string) {
    return this.httpClient.callNoError<Array<InstructorTeachingEvent>>({
      path: `/events/teaching/weeks/${weekStartDate}`,
      method: 'GET',
    });
  }

  async getTeachingUpcomingWeek(fromWeek?: string) {
    return this.httpClient.callNoError<InstructorTeachingUpcomingWeek>({
      path: '/events/teaching/upcoming-week',
      method: 'GET',
      params: {
        ...(fromWeek ? { from: fromWeek } : {}),
      },
    });
  }

  async getTeachingRoster(eventId: string) {
    return this.httpClient.callNoError<Array<InstructorTeachingRosterEntry>>({
      path: `/events/teaching/${eventId}/roster`,
      method: 'GET',
    });
  }

  async listCollaborations() {
    return this.httpClient.callNoError<Array<CollaboratorEventSummary>>({
      path: '/events/collaborations',
      method: 'GET',
    });
  }

  async collaboratorRoster(eventId: string) {
    return this.httpClient.callNoError<Array<EventRosterEntry>>({
      path: `/events/collaborations/${eventId}/roster`,
      method: 'GET',
    });
  }

  async collaboratorPayments(eventId: string) {
    return this.httpClient.callNoError<Array<CollaboratorPaymentItem>>({
      path: `/events/collaborations/${eventId}/payments`,
      method: 'GET',
    });
  }

  async reviewCollaboratorPayment(
    eventId: string,
    paymentIntentId: string,
    payload: { action: 'approve' | 'reject'; admin_notes?: string | null },
  ) {
    return this.httpClient.callNoError<CollaboratorPaymentItem>({
      path: `/events/collaborations/${eventId}/payments/${paymentIntentId}/review`,
      method: 'POST',
      data: payload,
    });
  }

  async collaboratorRegister(eventId: string, payload: DirectRegistrationPayload) {
    return this.httpClient.callNoError<EventRosterEntry, DirectRegistrationPayload>({
      path: `/events/collaborations/${eventId}/registrations`,
      method: 'POST',
      data: payload,
    });
  }

  async uploadCollaboratorPaymentQr(eventId: string, file: File) {
    const response = await this.httpClient.callNoError<EventImageUploadResponse, EventImageUploadRequest>({
      path: `/events/collaborations/${eventId}/payment-qr/upload-url`,
      method: 'POST',
      data: { content_type: file.type as EventImageUploadRequest['content_type'] },
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
      throw new Error('EVENT_IMAGE_UPLOAD_FAILED');
    }

    return this.httpClient.callNoError<EventAdmin, EventImageConfirmRequest>({
      path: `/events/collaborations/${eventId}/payment-qr/confirm`,
      method: 'POST',
      data: { file_key: response.data.file_key },
    });
  }
}
