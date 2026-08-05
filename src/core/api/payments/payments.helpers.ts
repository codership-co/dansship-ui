import type { AdminPaymentListResponse, BoldCheckoutConfig, PaymentIntent } from './payments.models';

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
    wallet_amount_applied: toNumber(intent.wallet_amount_applied),
  };
}

export function normalizeAdminList(response: AdminPaymentListResponse): AdminPaymentListResponse {
  return {
    items: (response.items ?? []).map(normalizeIntent),
    total: toNumber(response.total),
  };
}

// BOLD

declare global {
  interface Window {
    BoldCheckout?: new (config: Record<string, string>) => {
      open: () => void;
    };
  }
}

const BOLD_SCRIPT_URL = 'https://checkout.bold.co/library/boldPaymentButton.js';

let boldScriptPromise: Promise<void> | null = null;

function parseMaybeJson(input?: string | null): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(input) as Record<string, unknown>;

    return parsed;
  } catch {
    return undefined;
  }
}

function toBoldSdkConfig(config: BoldCheckoutConfig): Record<string, string> {
  const payload: Record<string, string> = {
    orderId: config.order_id,
    currency: config.currency,
    amount: config.amount,
    apiKey: config.api_key,
    integritySignature: config.integrity_signature,
    description: config.description,
    redirectionUrl: config.redirection_url,
    renderMode: config.render_mode,
  };

  if (config.customer_data) {
    const parsed = parseMaybeJson(config.customer_data);

    if (parsed) {
      payload.customerData = JSON.stringify(parsed);
    }
  }

  return payload;
}

export function ensureBoldCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('WINDOW_UNAVAILABLE'));
  }

  if (window.BoldCheckout) {
    return Promise.resolve();
  }

  if (boldScriptPromise) {
    return boldScriptPromise;
  }

  boldScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${BOLD_SCRIPT_URL}"]`) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('BOLD_SCRIPT_LOAD_FAILED')), { once: true });

      return;
    }

    const script = document.createElement('script');
    script.src = BOLD_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('BOLD_SCRIPT_LOAD_FAILED'));

    document.head.appendChild(script);
  });

  return boldScriptPromise;
}

export async function openBoldEmbeddedCheckout(config: BoldCheckoutConfig): Promise<void> {
  await ensureBoldCheckoutScript();

  if (!window.BoldCheckout) {
    throw new Error('BOLD_SDK_NOT_AVAILABLE');
  }

  const checkout = new window.BoldCheckout(toBoldSdkConfig(config));
  checkout.open();
}
