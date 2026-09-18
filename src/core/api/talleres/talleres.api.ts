import { HttpClient } from 'polpo-http-client';

import { toNumber } from '../payments/payments.helpers';

import { DansshipAPIError, type PaymentPreviewMappedResponse, type PaymentPreviewResponse } from '@core/api';

import type {
  PartnerLookupResponse,
  WorkshopCatalogCard,
  WorkshopLanding,
  WorkshopPurchaseCreatePayload,
  WorkshopPurchaseResponse,
  MyWorkshopRegistration,
  MyWorkshopRegistrationScope,
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
}
