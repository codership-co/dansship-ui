import type { AdminPaymentListResponse, PaymentIntent } from './payments.models';

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

export function normalizeIntent(intent: PaymentIntent): PaymentIntent {
  return {
    ...intent,
    amount: toNumber(intent.amount),
  };
}

export function normalizeAdminList(response: AdminPaymentListResponse): AdminPaymentListResponse {
  return {
    items: (response.items ?? []).map(normalizeIntent),
    total: toNumber(response.total),
  };
}
