import { HttpClient } from 'polpo-http-client';

import { toNumber } from '../payments/payments.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  MyParticipationRow,
  MySignup,
  ParticipantForm,
  SignupSubmitPayload,
  TicketLine,
  TicketPurchaseDetail,
  TicketPurchasePayload,
  TicketPurchaseResult,
  TicketQuote,
  TicketQuotePayload,
  TicketTotals,
} from './participation.models';

type RawLine = Omit<TicketLine, 'price'> & { price: string | number };
type RawPreview = Record<keyof TicketTotals, string | number>;

function toLines(lines: Array<RawLine>): Array<TicketLine> {
  return lines.map(line => ({ ...line, price: toNumber(line.price) }));
}

function toTotals(preview: RawPreview): TicketTotals {
  return {
    final_price: toNumber(preview.final_price),
    base_amount: toNumber(preview.base_amount),
    tax_amount: toNumber(preview.tax_amount),
    wallet_amount_applied: toNumber(preview.wallet_amount_applied),
    amount_to_charge: toNumber(preview.amount_to_charge),
  };
}

/** Signer side of participant types (ADR-064): artist registration and "Mis reservas" rows. */
export class ParticipationAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getForm(typeId: string, accessToken?: string | null) {
    return this.httpClient.callNoError<ParticipantForm>({
      path: `/events/participant-types/${typeId}/form`,
      method: 'GET',
      params: accessToken ? { access_token: accessToken } : undefined,
    });
  }

  async submit(typeId: string, payload: SignupSubmitPayload) {
    return this.httpClient.callNoError<MySignup, SignupSubmitPayload>({
      path: `/events/participant-types/${typeId}/signups`,
      method: 'POST',
      data: payload,
    });
  }

  async update(signupId: string, payload: SignupSubmitPayload) {
    return this.httpClient.callNoError<MySignup, SignupSubmitPayload>({
      path: `/events/signups/${signupId}`,
      method: 'PUT',
      data: payload,
    });
  }

  async getMine(signupId: string) {
    return this.httpClient.callNoError<MySignup>({
      path: `/events/signups/${signupId}`,
      method: 'GET',
    });
  }

  async listMine(scope: 'upcoming' | 'history') {
    return this.httpClient.callNoError<Array<MyParticipationRow>>({
      path: '/events/participations/me',
      method: 'GET',
      params: { scope },
    });
  }

  /** Step 1 "Siguiente": the server prices each ticket by its own email. */
  async quoteTickets(slug: string, payload: TicketQuotePayload) {
    return this.httpClient.callNoError<
      { tickets: Array<RawLine>; preview: RawPreview },
      TicketQuotePayload,
      TicketQuote
    >({ path: `/events/by-slug/${slug}/tickets/quote`, method: 'POST', data: payload }, data => ({
      tickets: toLines(data.tickets),
      totals: toTotals(data.preview),
    }));
  }

  async purchaseTickets(slug: string, payload: TicketPurchasePayload) {
    return this.httpClient.callNoError<
      Omit<TicketPurchaseResult, 'tickets' | 'total' | 'amount_to_charge'> & {
        tickets: Array<RawLine>;
        total: string | number;
        amount_to_charge: string | number;
      },
      TicketPurchasePayload,
      TicketPurchaseResult
    >({ path: `/events/by-slug/${slug}/tickets/purchases`, method: 'POST', data: payload }, data => ({
      ...data,
      tickets: toLines(data.tickets),
      total: toNumber(data.total),
      amount_to_charge: toNumber(data.amount_to_charge),
    }));
  }

  async getTicketPurchase(purchaseId: string) {
    return this.httpClient.callNoError<
      Omit<TicketPurchaseDetail, 'tickets' | 'totals'> & { tickets: Array<RawLine>; preview: RawPreview },
      object,
      TicketPurchaseDetail
    >({ path: `/events/ticket-purchases/${purchaseId}`, method: 'GET' }, ({ preview, tickets, ...data }) => ({
      ...data,
      tickets: toLines(tickets),
      totals: toTotals(preview),
    }));
  }

  /** "Volver a pagar": same tickets and prices, a new payment intent. */
  async repayTickets(purchaseId: string, paymentMethodType: string) {
    return this.httpClient.callNoError<{ payment_intent_id: string }, { payment_method_type: string }>({
      path: `/events/ticket-purchases/${purchaseId}/repay`,
      method: 'POST',
      data: { payment_method_type: paymentMethodType },
    });
  }
}
