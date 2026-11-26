import { HttpClient } from 'polpo-http-client';

import { toNumber } from '../payments/payments.helpers';

import { uploadAnswerFile } from './participation.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  AnswerFileUpload,
  AnswerFileView,
  FileAnswer,
  LinkAnswer,
  MyParticipationRow,
  MySignup,
  ParticipantForm,
  SignupApplication,
  SignupAnswerView,
  SignupApplicationResult,
  SignupPaymentResult,
  SignupQuote,
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

type RawSignupResult = Omit<SignupApplicationResult, 'lines' | 'total' | 'amount_to_charge'> & {
  lines: Array<RawLine>;
  total: string | number;
  amount_to_charge: string | number | null;
};

type RawSignupPayment = Omit<SignupPaymentResult, 'amount_to_charge'> & {
  amount_to_charge: string | number;
};

function toSignupPayment(data: RawSignupPayment): SignupPaymentResult {
  return { ...data, amount_to_charge: toNumber(data.amount_to_charge) };
}

/** Signer side of participant types (ADR-064, events redesign): one signup flow and "Mis reservas" rows. */
export class ParticipationAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  /** `preview` is the admin's "Previsualizar": a draft's form too (read only). */
  async getForm(typeId: string, preview = false) {
    return this.httpClient.callNoError<ParticipantForm>({
      path: preview
        ? `/admin/events/preview/participant-types/${typeId}/form`
        : `/events/participant-types/${typeId}/form`,
      method: 'GET',
    });
  }

  /** One quote for any type: lines, total and (paid types) the payment preview. `preview`: the admin's preview. */
  async quoteSignup(slug: string, payload: SignupApplication, preview = false) {
    return this.httpClient.callNoError<
      {
        charges_money: boolean;
        lines: Array<RawLine>;
        total: string | number;
        preview: RawPreview | null;
      },
      SignupApplication,
      SignupQuote
    >(
      {
        path: preview ? `/admin/events/preview/${slug}/signups/quote` : `/events/by-slug/${slug}/signups/quote`,
        method: 'POST',
        data: payload,
      },
      data => ({
        charges_money: data.charges_money,
        lines: toLines(data.lines),
        total: toNumber(data.total),
        totals: data.preview ? toTotals(data.preview) : null,
      }),
    );
  }

  /** One signup for any type; paid types also open the purchase and its payment intent. */
  async submitSignup(slug: string, payload: SignupApplication) {
    return this.httpClient.callNoError<RawSignupResult, SignupApplication, SignupApplicationResult>(
      {
        path: `/events/by-slug/${slug}/signups`,
        method: 'POST',
        data: payload,
      },
      data => ({
        ...data,
        lines: toLines(data.lines),
        total: toNumber(data.total),
        amount_to_charge: data.amount_to_charge === null ? null : toNumber(data.amount_to_charge),
      }),
    );
  }

  /** "Pagar" a "paga después" signup without a plan (the whole amount). */
  async paySignup(signupId: string, paymentMethodType: string) {
    return this.httpClient.callNoError<RawSignupPayment, { payment_method_type: string }, SignupPaymentResult>(
      {
        path: `/events/signups/${signupId}/pay`,
        method: 'POST',
        data: { payment_method_type: paymentMethodType },
      },
      toSignupPayment,
    );
  }

  /** "Pagar anticipo" / "Pagar siguiente cuota": a transfer for the given installment lines. */
  async paySignupInstallments(signupId: string, sequences: Array<number>) {
    return this.httpClient.callNoError<RawSignupPayment, { sequences: Array<number> }, SignupPaymentResult>(
      {
        path: `/events/signups/${signupId}/installments/pay`,
        method: 'POST',
        data: { sequences },
      },
      toSignupPayment,
    );
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

  /** Presigned upload for a file answer; the person needs access to the event. */
  async requestAnswerUpload(typeId: string, fieldKey: string, contentType: string) {
    return this.httpClient.callNoError<AnswerFileUpload, { content_type: string }>({
      path: `/events/participant-types/${typeId}/fields/${fieldKey}/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  async uploadAnswerFile(typeId: string, fieldKey: string, file: File): Promise<FileAnswer> {
    return uploadAnswerFile(file, async () => {
      const { ok, data, error } = await this.requestAnswerUpload(typeId, fieldKey, file.type);

      if (!ok) throw error;

      return data;
    });
  }

  /** A short-lived link to my uploaded file. */
  async getMyAnswerFile(signupId: string, fieldKey: string) {
    return this.httpClient.callNoError<AnswerFileView>({
      path: `/events/signups/${signupId}/answers/${fieldKey}/file`,
      method: 'GET',
    });
  }

  /** Replaces one file answer while its window is open, even after the type closed. */
  async replaceAnswer(signupId: string, fieldKey: string, value: FileAnswer | LinkAnswer) {
    return this.httpClient.callNoError<SignupAnswerView, { value: FileAnswer | LinkAnswer }>({
      path: `/events/signups/${signupId}/answers/${fieldKey}`,
      method: 'PUT',
      data: { value },
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
    >(
      {
        path: `/events/by-slug/${slug}/tickets/quote`,
        method: 'POST',
        data: payload,
      },
      data => ({
        tickets: toLines(data.tickets),
        totals: toTotals(data.preview),
      }),
    );
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
    >(
      {
        path: `/events/by-slug/${slug}/tickets/purchases`,
        method: 'POST',
        data: payload,
      },
      data => ({
        ...data,
        tickets: toLines(data.tickets),
        total: toNumber(data.total),
        amount_to_charge: toNumber(data.amount_to_charge),
      }),
    );
  }

  async getTicketPurchase(purchaseId: string) {
    return this.httpClient.callNoError<
      Omit<TicketPurchaseDetail, 'tickets' | 'totals'> & {
        tickets: Array<RawLine>;
        preview: RawPreview;
      },
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
